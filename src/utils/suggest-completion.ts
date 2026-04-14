import type { LogDataSet, CompletionEquipment } from '../types';
import { v4 as uuidv4 } from 'uuid';
import {
  DEFAULT_BLANK_PIPE,
  DEFAULT_SAND_SCREEN,
  DEFAULT_SWELL_PACKER,
  DEFAULT_ICD_SCREEN,
  STANDARD_LENGTH,
} from '../constants';

/**
 * Build a heuristic completion based on log curves.
 *
 * Algorithm (simple but useful for a demo-level suggestion):
 *  - Walk the log curve depths in 0.5 m samples.
 *  - Classify each sample as "net pay" when PHIE >= 0.12 and SW <= 0.55
 *    (falling back to VCL <= 0.35 or GR <= 60 if those curves are missing).
 *  - Group adjacent net-pay samples into zones.
 *  - For each zone, place an ICD/sand screen snapped to the 12 m standard length.
 *  - Place a swell packer between zones (and at hanger / TD shoulders) to
 *    achieve zonal isolation.
 *  - Fill everything else with blank pipe.
 */
export function suggestCompletion(
  logData: LogDataSet,
  hangerMD: number,
  tdMD: number
): CompletionEquipment[] {
  const { curves, depthCurve } = logData;
  const phie = curves.find((c) => c.name.toUpperCase() === 'PHIE');
  const sw = curves.find((c) => c.name.toUpperCase() === 'SW');
  const vcl = curves.find((c) => c.name.toUpperCase() === 'VCL');
  const gr = curves.find((c) => c.name.toUpperCase() === 'GR');

  const isNetPay = (i: number): boolean => {
    const p = phie?.data[i];
    const s = sw?.data[i];
    const v = vcl?.data[i];
    const g = gr?.data[i];
    if (phie && p != null && p !== phie.nullValue && p >= 0.12) {
      if (sw && s != null && s !== sw.nullValue && s > 0.55) return false;
      return true;
    }
    if (vcl && v != null && v !== vcl.nullValue && v <= 0.35) return true;
    if (gr && g != null && g !== gr.nullValue && g <= 60) return true;
    return false;
  };

  // Collect (top, bottom) pay zones clipped to [hangerMD, tdMD].
  const zones: { top: number; bottom: number }[] = [];
  let zoneTop: number | null = null;
  for (let i = 0; i < depthCurve.length; i++) {
    const d = depthCurve[i];
    if (d < hangerMD || d > tdMD) continue;
    if (isNetPay(i)) {
      if (zoneTop === null) zoneTop = d;
    } else if (zoneTop !== null) {
      zones.push({ top: zoneTop, bottom: d });
      zoneTop = null;
    }
  }
  if (zoneTop !== null) zones.push({ top: zoneTop, bottom: tdMD });

  // Merge tiny gaps (<3 m) and drop tiny zones (<3 m).
  const merged: { top: number; bottom: number }[] = [];
  for (const z of zones) {
    if (z.bottom - z.top < 3) continue;
    const prev = merged[merged.length - 1];
    if (prev && z.top - prev.bottom < 3) {
      prev.bottom = z.bottom;
    } else {
      merged.push({ ...z });
    }
  }

  const items: CompletionEquipment[] = [];
  const screenStd = STANDARD_LENGTH.sand_screen ?? 12.0;
  const packerStd = STANDARD_LENGTH.swell_packer ?? 3.0;

  // Choose screen type: prefer ICD if permeability curve exists (implies reservoir engineering awareness)
  const perm = curves.find((c) => c.name.toUpperCase() === 'PERM');
  const useICD = Boolean(perm);

  let cursor = hangerMD;

  const addBlank = (top: number, bottom: number) => {
    if (bottom - top <= 0.01) return;
    items.push({
      id: uuidv4(),
      type: 'blank_pipe',
      topMD: top,
      bottomMD: bottom,
      length: bottom - top,
      od: DEFAULT_BLANK_PIPE.od,
      innerDiameter: DEFAULT_BLANK_PIPE.innerDiameter,
      jointLength: DEFAULT_BLANK_PIPE.jointLength,
      grade: DEFAULT_BLANK_PIPE.grade,
      weight: DEFAULT_BLANK_PIPE.weight,
      connectionType: DEFAULT_BLANK_PIPE.connectionType,
    });
  };

  const addPacker = (center: number) => {
    const top = center - packerStd / 2;
    const bottom = top + packerStd;
    items.push({
      id: uuidv4(),
      type: 'swell_packer',
      topMD: top,
      bottomMD: bottom,
      length: packerStd,
      od: DEFAULT_SWELL_PACKER.od,
      innerDiameter: DEFAULT_SWELL_PACKER.innerDiameter,
      swellMedium: DEFAULT_SWELL_PACKER.swellMedium,
      swellTime: DEFAULT_SWELL_PACKER.swellTime,
      maxOD: DEFAULT_SWELL_PACKER.maxOD,
      bodyOD: DEFAULT_SWELL_PACKER.bodyOD,
    });
    return bottom;
  };

  for (let zi = 0; zi < merged.length; zi++) {
    const zone = merged[zi];

    // Snap zone to integer multiples of screenStd
    const zoneLen = Math.max(screenStd, Math.round((zone.bottom - zone.top) / screenStd) * screenStd);
    let zTop = zone.top;
    let zBottom = Math.min(tdMD, zTop + zoneLen);

    // Place a swell packer above the zone (except for the first zone flush at hangerMD)
    const gapAbove = zTop - cursor;
    if (gapAbove > packerStd + 1) {
      addBlank(cursor, zTop - packerStd);
      cursor = addPacker(zTop - packerStd / 2);
    } else if (gapAbove > 0) {
      addBlank(cursor, zTop);
      cursor = zTop;
    }

    // Fill screens across the zone
    const nScreens = Math.max(1, Math.round((zBottom - zTop) / screenStd));
    for (let i = 0; i < nScreens; i++) {
      const sTop = zTop + i * screenStd;
      const sBottom = Math.min(zBottom, sTop + screenStd);
      if (useICD) {
        items.push({
          id: uuidv4(),
          type: 'icd_screen',
          topMD: sTop,
          bottomMD: sBottom,
          length: sBottom - sTop,
          od: DEFAULT_ICD_SCREEN.od,
          innerDiameter: DEFAULT_ICD_SCREEN.innerDiameter,
          meshSize: DEFAULT_ICD_SCREEN.meshSize,
          screenType: DEFAULT_ICD_SCREEN.screenType,
          gaugeOD: DEFAULT_ICD_SCREEN.gaugeOD,
          nozzleCount: DEFAULT_ICD_SCREEN.nozzleCount,
          nozzleSize: DEFAULT_ICD_SCREEN.nozzleSize,
          flowArea: DEFAULT_ICD_SCREEN.flowArea,
        });
      } else {
        items.push({
          id: uuidv4(),
          type: 'sand_screen',
          topMD: sTop,
          bottomMD: sBottom,
          length: sBottom - sTop,
          od: DEFAULT_SAND_SCREEN.od,
          innerDiameter: DEFAULT_SAND_SCREEN.innerDiameter,
          meshSize: DEFAULT_SAND_SCREEN.meshSize,
          screenType: DEFAULT_SAND_SCREEN.screenType,
          gaugeOD: DEFAULT_SAND_SCREEN.gaugeOD,
        });
      }
    }
    cursor = zBottom;

    // Packer after zone (for isolation), unless we are at TD
    if (zi < merged.length - 1 && cursor + packerStd < tdMD) {
      cursor = addPacker(cursor + packerStd / 2);
    }
  }

  if (cursor < tdMD) addBlank(cursor, tdMD);

  items.sort((a, b) => a.topMD - b.topMD);
  return items;
}
