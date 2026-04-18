import * as XLSX from 'xlsx';
import type { LogDataSet, LogCurve, CompletionString, CompletionEquipment, BlankPipe } from '../types';
import { COLUMN_NAME_MAP, DEFAULT_NULL_VALUE } from '../constants';
import { DEFAULT_BLANK_PIPE } from '../constants';
import { v4 as uuidv4 } from 'uuid';

/**
 * Parse a CPI log Excel file into a LogDataSet.
 */
export async function parseExcelCPILogs(file: File): Promise<LogDataSet> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rawData = XLSX.utils.sheet_to_json<Record<string, any>>(sheet);

  if (rawData.length === 0) {
    throw new Error('Empty spreadsheet');
  }

  // Get column names and map them to standard names
  const rawColumns = Object.keys(rawData[0]);
  const columnMapping: Record<string, string> = {};

  for (const col of rawColumns) {
    const normalized = col.toLowerCase().trim();
    const mapped = COLUMN_NAME_MAP[normalized];
    if (mapped) {
      columnMapping[col] = mapped;
    } else {
      // Use the original column name as-is (uppercase)
      columnMapping[col] = col.toUpperCase();
    }
  }

  // Find the depth column — try mapped 'MD', then look for DEPTH/DEPT/DBTM directly
  let depthCol = rawColumns.find((c) => columnMapping[c] === 'MD');
  if (!depthCol) {
    depthCol = rawColumns.find((c) => {
      const u = c.toUpperCase();
      return u === 'DEPTH' || u === 'DEPT' || u === 'DBTM' || u === 'DMEA';
    });
  }
  if (!depthCol) {
    throw new Error('No depth (MD) column found. Expected column named: MD, DEPTH, DEPT, or DBTM');
  }

  // Parse depth curve
  const depthCurve: number[] = [];
  for (const row of rawData) {
    const val = parseFloat(row[depthCol]);
    if (!isNaN(val)) {
      depthCurve.push(val);
    }
  }

  if (depthCurve.length === 0) {
    throw new Error('No valid depth values found');
  }

  // Parse all other columns as log curves
  const curves: LogCurve[] = [];
  for (const col of rawColumns) {
    if (col === depthCol) continue;

    const curveName = columnMapping[col] ?? col.toUpperCase();
    if (curveName === 'TVD') continue; // Skip TVD, we use MD

    const data: number[] = [];
    for (const row of rawData) {
      const val = parseFloat(row[col]);
      data.push(isNaN(val) ? DEFAULT_NULL_VALUE : val);
    }

    // Only include curves that have at least some valid data
    const validCount = data.filter((v) => v !== DEFAULT_NULL_VALUE).length;
    if (validCount > 0) {
      curves.push({
        name: curveName,
        unit: getUnitForCurve(curveName),
        description: curveName,
        data,
        nullValue: DEFAULT_NULL_VALUE,
      });
    }
  }

  const depthStep = depthCurve.length > 1 ? depthCurve[1] - depthCurve[0] : 0.1524;

  return {
    wellName: file.name.replace(/\.(xlsx|xls|csv)$/i, ''),
    depthCurve,
    depthUnit: 'm',
    curves,
    depthStep,
    minDepth: depthCurve[0],
    maxDepth: depthCurve[depthCurve.length - 1],
  };
}

/**
 * Parse an Excel tally file into a CompletionString.
 */
export async function parseExcelTally(file: File): Promise<CompletionString> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rawData = XLSX.utils.sheet_to_json<Record<string, any>>(sheet);

  const items: CompletionEquipment[] = [];
  let minMD = Infinity;
  let maxMD = -Infinity;

  for (const row of rawData) {
    const topMD = parseFloat(row['Top MD'] ?? row['top_md'] ?? row['TopMD'] ?? row['topMD'] ?? 0);
    const bottomMD = parseFloat(row['Bottom MD'] ?? row['bottom_md'] ?? row['BottomMD'] ?? row['bottomMD'] ?? 0);

    if (isNaN(topMD) || isNaN(bottomMD)) continue;

    minMD = Math.min(minMD, topMD);
    maxMD = Math.max(maxMD, bottomMD);

    const pipe: BlankPipe = {
      id: uuidv4(),
      type: 'blank_pipe',
      topMD,
      bottomMD,
      length: bottomMD - topMD,
      od: parseFloat(row['OD'] ?? DEFAULT_BLANK_PIPE.od),
      innerDiameter: parseFloat(row['ID'] ?? DEFAULT_BLANK_PIPE.innerDiameter),
      jointLength: DEFAULT_BLANK_PIPE.jointLength,
    };
    items.push(pipe);
  }

  items.sort((a, b) => a.topMD - b.topMD);

  return {
    wellName: file.name.replace(/\.(xlsx|xls)$/i, ''),
    items,
    hangerMD: minMD,
    tdMD: maxMD,
  };
}

function getUnitForCurve(name: string): string {
  const units: Record<string, string> = {
    GR: 'gAPI',
    PHIE: 'v/v',
    PERM: 'mD',
    SW: 'frac',
    NETPAY: 'flag',
    RT: 'ohm.m',
    RHOB: 'g/cc',
    NPHI: 'v/v',
    VCL: 'frac',
    ROP5: 'm/h',
    SPPA: 'bar',
    HKLA: '10 kN',
    ECD: 'g/cm3',
    RPMA: 'c/min',
    TDRA: 'kN.m',
    MFIA: 'L/min',
    TQA: 'kN.m',
    WOBA: '10 kN',
    BPOS: 'm',
    INCL: 'deg',
    AZIM: 'deg',
    DLS: 'deg/30m',
    DHAT: 'degC',
    TFLO: 'L/min',
    SWOB: '10 kN',
    PVEL: 'm/h',
    BLKP: 'm',
    STICK: 'c/min',
    SHKRSK: 'Euc',
    TRPM: 'c/min',
    RPM: 'c/min',
    STOR: 'kN.m',
    DHAP: 'bar',
  };
  return units[name] ?? '';
}
