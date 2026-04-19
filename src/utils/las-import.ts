import type { LogDataSet, LogCurve } from '../types';
import { COLUMN_NAME_MAP, DEFAULT_NULL_VALUE } from '../constants';

interface LASCurveInfo {
  mnemonic: string;
  unit: string;
  description: string;
  colIndex: number;
}

const DEPTH_MNEMONICS = new Set(['DEPTH', 'DEPT', 'DBTM', 'DMEA', 'MD', 'MEASURED_DEPTH']);

export async function parseLASFile(file: File): Promise<LogDataSet> {
  let text = await file.text();
  // Strip BOM if present
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);

  const lines = text.split(/\r?\n/);

  let wellName = file.name.replace(/\.las$/i, '');
  let depthUnit: 'm' | 'ft' = 'm';
  let nullValue = DEFAULT_NULL_VALUE;
  const curveInfos: LASCurveInfo[] = [];
  let section = '';
  let isWrapped = false;
  let curveIndex = 0;

  const depthValues: number[] = [];
  const curveData: Map<number, number[]> = new Map();
  let depthColIndex = -1;
  let numericColIndices: number[] = [];
  const tokensPerCol: number[] = [];
  let firstDataLine = true;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    if (line.startsWith('~')) {
      const sectionChar = line[1]?.toUpperCase();
      if (sectionChar === 'V') section = 'VERSION';
      else if (sectionChar === 'W') section = 'WELL';
      else if (sectionChar === 'C') section = 'CURVE';
      else if (sectionChar === 'P') section = 'PARAMETER';
      else if (sectionChar === 'A') {
        section = 'DATA';
        identifyColumns();
      }
      else section = sectionChar ?? '';
      continue;
    }

    if (section === 'VERSION') {
      const match = line.match(/^WRAP\s*\.\s*(\S+)/i);
      if (match) isWrapped = match[1].toUpperCase() === 'YES';
      continue;
    }

    if (section === 'WELL') {
      const wMatch = line.match(/^WELL\s*\.\s*(.*?):/i);
      if (wMatch && wMatch[1].trim()) wellName = wMatch[1].trim();
      const nullMatch = line.match(/^NULL\s*\.\s*([\d.eE+-]+)/i);
      if (nullMatch) nullValue = parseFloat(nullMatch[1]);
      const fldMatch = line.match(/^FLD\s*\.\s*(.*?):/i);
      if (fldMatch && fldMatch[1].trim() && wellName === file.name.replace(/\.las$/i, '')) {
        wellName = fldMatch[1].trim();
      }
      continue;
    }

    if (section === 'CURVE') {
      const cMatch = line.match(/^(\S+)\s*\.(\S*)\s*(.*?):/);
      if (cMatch) {
        const mnemonic = cMatch[1].toUpperCase();
        const unit = cMatch[2] || '';
        if (unit.toLowerCase() === 'm' || unit.toLowerCase() === 'ft') {
          if (unit.toLowerCase() === 'ft') depthUnit = 'ft';
        }
        curveInfos.push({
          mnemonic,
          unit,
          description: (cMatch[3] || '').trim(),
          colIndex: curveIndex,
        });
        curveIndex++;
      }
      continue;
    }

    if (section === 'DATA') {
      parseDataLine(line);
    }
  }

  if (curveInfos.length === 0) throw new Error('No curve definitions found in LAS file.');
  if (depthValues.length === 0) throw new Error('No data rows found in LAS file. Found ' + curveInfos.length + ' curves but no valid depth values.');

  const minDepth = Math.min(...depthValues);
  const maxDepth = Math.max(...depthValues);
  const depthStep = depthValues.length > 1 ? Math.abs(depthValues[1] - depthValues[0]) : 0.1;

  const curves: LogCurve[] = [];
  for (const info of curveInfos) {
    if (info.colIndex === depthColIndex) continue;
    const isNonNumericCol = !numericColIndices.includes(info.colIndex);
    if (isNonNumericCol) continue;

    const data = curveData.get(info.colIndex) ?? [];
    const standardName = COLUMN_NAME_MAP[info.mnemonic.toLowerCase()] || info.mnemonic;

    curves.push({
      name: standardName,
      unit: info.unit,
      description: info.description || standardName,
      data,
      nullValue,
    });
  }

  return {
    wellName,
    depthCurve: depthValues,
    depthUnit,
    curves,
    depthStep,
    minDepth,
    maxDepth,
  };

  function identifyColumns() {
    for (const info of curveInfos) {
      if (DEPTH_MNEMONICS.has(info.mnemonic)) {
        depthColIndex = info.colIndex;
        break;
      }
    }
    if (depthColIndex === -1) {
      for (const info of curveInfos) {
        if (info.unit.toLowerCase() === 'm' || info.unit.toLowerCase() === 'ft') {
          depthColIndex = info.colIndex;
          break;
        }
      }
    }
    if (depthColIndex === -1) depthColIndex = 0;

    const nonNumericUnits = new Set(['d', 's', 'c']);
    numericColIndices = curveInfos
      .filter(info => {
        if (info.colIndex === depthColIndex) return false;
        const u = info.unit.toLowerCase();
        if (nonNumericUnits.has(u)) return false;
        const m = info.mnemonic;
        if (m === 'TIME' || m === 'TIME_1900' || m === 'DATE') return false;
        return true;
      })
      .map(info => info.colIndex);

    // Default: 1 token per column. Auto-detected from first data line.
    for (const info of curveInfos) {
      tokensPerCol[info.colIndex] = 1;
    }

    for (const idx of numericColIndices) {
      curveData.set(idx, []);
    }
  }

  function parseDataLine(line: string) {
    const tokens = line.split(/\s+/).filter(t => t.length > 0);
    if (tokens.length === 0) return;

    // Auto-detect token counts from first data line: if total tokens exceeds
    // number of curves, date columns (unit 'd') must consume 2 tokens each
    // (e.g. "22.12.2023 00:00:08").
    if (firstDataLine) {
      firstDataLine = false;
      const extra = tokens.length - curveInfos.length;
      if (extra > 0) {
        let remaining = extra;
        for (const info of curveInfos) {
          if (remaining <= 0) break;
          if (info.unit.toLowerCase() === 'd') {
            tokensPerCol[info.colIndex] = 2;
            remaining--;
          }
        }
      }
    }

    const numericValues: Map<number, number> = new Map();
    let tokenIdx = 0;

    for (let colIdx = 0; colIdx < curveInfos.length; colIdx++) {
      const consume = tokensPerCol[colIdx] ?? 1;
      if (tokenIdx >= tokens.length) break;

      if (colIdx === depthColIndex) {
        const v = Number(tokens[tokenIdx]);
        if (!isNaN(v)) numericValues.set(colIdx, v);
        tokenIdx += consume;
        continue;
      }

      if (numericColIndices.includes(colIdx)) {
        const v = Number(tokens[tokenIdx]);
        numericValues.set(colIdx, isNaN(v) ? NaN : v);
      }

      tokenIdx += consume;
    }

    const depthVal = numericValues.get(depthColIndex);
    if (depthVal === undefined || isNaN(depthVal)) return;

    depthValues.push(depthVal);

    for (const colIdx of numericColIndices) {
      const arr = curveData.get(colIdx)!;
      const v = numericValues.get(colIdx);
      if (v === undefined || isNaN(v) || v === nullValue) {
        arr.push(NaN);
      } else {
        arr.push(v);
      }
    }
  }
}
