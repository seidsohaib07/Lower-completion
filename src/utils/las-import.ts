import type { LogDataSet, LogCurve } from '../types';
import { COLUMN_NAME_MAP, DEFAULT_NULL_VALUE } from '../constants';

interface LASCurveInfo {
  mnemonic: string;
  unit: string;
  description: string;
}

export async function parseLASFile(file: File): Promise<LogDataSet> {
  const text = await file.text();
  const lines = text.split(/\r?\n/);

  let wellName = file.name.replace(/\.las$/i, '');
  let depthUnit: 'm' | 'ft' = 'm';
  let nullValue = DEFAULT_NULL_VALUE;
  const curveInfos: LASCurveInfo[] = [];
  let section = '';
  const dataRows: number[][] = [];
  let isWrapped = false;
  let wrapBuffer: number[] = [];
  let expectedCols = 0;

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
        expectedCols = curveInfos.length;
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
      const stepMatch = line.match(/^STRT\s*\.(\S*)/i);
      if (stepMatch && stepMatch[1]) {
        const u = stepMatch[1].toUpperCase();
        if (u === 'F' || u === 'FT' || u === 'FEET') depthUnit = 'ft';
      }
      continue;
    }

    if (section === 'CURVE') {
      const cMatch = line.match(/^(\S+)\s*\.(\S*)\s*(.*?):/);
      if (cMatch) {
        curveInfos.push({
          mnemonic: cMatch[1].toUpperCase(),
          unit: cMatch[2] || '',
          description: (cMatch[3] || '').trim(),
        });
      }
      continue;
    }

    if (section === 'DATA') {
      const values = line.split(/\s+/).map(Number).filter((v) => !isNaN(v));
      if (values.length === 0) continue;

      if (isWrapped) {
        wrapBuffer.push(...values);
        while (wrapBuffer.length >= expectedCols) {
          dataRows.push(wrapBuffer.splice(0, expectedCols));
        }
      } else {
        if (values.length === expectedCols) {
          dataRows.push(values);
        }
      }
    }
  }

  if (isWrapped && wrapBuffer.length >= expectedCols) {
    dataRows.push(wrapBuffer.splice(0, expectedCols));
  }

  if (curveInfos.length === 0) throw new Error('No curve definitions found in LAS file.');
  if (dataRows.length === 0) throw new Error('No data rows found in LAS file.');

  const depthCol = 0;
  const depthCurve = dataRows.map((row) => row[depthCol]);
  const minDepth = Math.min(...depthCurve);
  const maxDepth = Math.max(...depthCurve);
  const depthStep = depthCurve.length > 1 ? Math.abs(depthCurve[1] - depthCurve[0]) : 0.1;

  const curves: LogCurve[] = [];
  for (let c = 1; c < curveInfos.length; c++) {
    const info = curveInfos[c];
    const data = dataRows.map((row) => {
      const v = row[c];
      return v === nullValue || v === undefined ? NaN : v;
    });

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
    depthCurve,
    depthUnit,
    curves,
    depthStep,
    minDepth,
    maxDepth,
  };
}
