import type { LogCurve } from '../types';
import { DEFAULT_NULL_VALUE } from '../constants';

/**
 * Check if a value is a null/missing value.
 */
export function isNullValue(value: number, nullValue: number = DEFAULT_NULL_VALUE): boolean {
  return value === nullValue || isNaN(value) || !isFinite(value);
}

/**
 * Map a curve value to a normalized 0-1 position within the track.
 */
export function valueToTrackPosition(
  value: number,
  scaleMin: number,
  scaleMax: number,
  scaleType: 'linear' | 'logarithmic'
): number {
  if (scaleType === 'logarithmic') {
    if (value <= 0) return 0;
    const logMin = Math.log10(Math.max(scaleMin, 1e-10));
    const logMax = Math.log10(Math.max(scaleMax, 1e-10));
    const logVal = Math.log10(value);
    return (logVal - logMin) / (logMax - logMin);
  }

  // Linear (handle reversed scales like NPHI where min > max)
  return (value - scaleMin) / (scaleMax - scaleMin);
}

/**
 * Decimate data for zoomed-out rendering.
 * Returns every Nth point to reduce draw calls.
 */
export function decimateData(
  depths: number[],
  values: number[],
  startIdx: number,
  endIdx: number,
  maxPoints: number
): { depths: number[]; values: number[] } {
  const count = endIdx - startIdx + 1;
  if (count <= maxPoints) {
    return {
      depths: depths.slice(startIdx, endIdx + 1),
      values: values.slice(startIdx, endIdx + 1),
    };
  }

  const step = Math.ceil(count / maxPoints);
  const decimatedDepths: number[] = [];
  const decimatedValues: number[] = [];

  for (let i = startIdx; i <= endIdx; i += step) {
    decimatedDepths.push(depths[i]);
    decimatedValues.push(values[i]);
  }

  // Always include the last point
  if (decimatedDepths[decimatedDepths.length - 1] !== depths[endIdx]) {
    decimatedDepths.push(depths[endIdx]);
    decimatedValues.push(values[endIdx]);
  }

  return { depths: decimatedDepths, values: decimatedValues };
}

/**
 * Get a curve by name from a list of curves.
 */
export function getCurveByName(curves: LogCurve[], name: string): LogCurve | undefined {
  return curves.find((c) => c.name.toUpperCase() === name.toUpperCase());
}
