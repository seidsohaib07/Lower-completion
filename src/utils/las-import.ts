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
  const text = await file.text();
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
  if (depthValues.length === 0) throw new Error('No data rows found in LAS file.');

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

    for (const idx of numericColIndices) {
      curveData.set(idx, []);
    }
  }

  function parseDataLine(line: string) {
    const tokens = line.split(/\s+/);
    if (tokens.length < curveInfos.length) {
      if (!isWrapped) return;
    }

    const numericValues: Map<number, number> = new Map();
    let tokenIdx = 0;

    for (let colIdx = 0; colIdx < curveInfos.length && tokenIdx < tokens.length; colIdx++) {
      const token = tokens[tokenIdx];
      tokenIdx++;

      if (colIdx === depthColIndex) {
        const v = Number(token);
        if (!isNaN(v)) {
          numericValues.set(colIdx, v);
        }
        continue;
      }

      if (numericColIndices.includes(colIdx)) {
        const v = Number(token);
        numericValues.set(colIdx, isNaN(v) ? NaN : v);
      }
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
