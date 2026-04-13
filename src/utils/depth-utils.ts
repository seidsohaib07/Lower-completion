/**
 * Binary search to find the index of the first depth >= targetDepth.
 */
export function findDepthIndex(depths: number[], targetDepth: number): number {
  let lo = 0;
  let hi = depths.length - 1;

  if (depths.length === 0) return 0;
  if (targetDepth <= depths[0]) return 0;
  if (targetDepth >= depths[hi]) return hi;

  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (depths[mid] < targetDepth) {
      lo = mid + 1;
    } else {
      hi = mid;
    }
  }
  return lo;
}

/**
 * Get the range of indices for depths visible in the viewport, with a buffer.
 */
export function getVisibleRange(
  depths: number[],
  topDepth: number,
  bottomDepth: number,
  buffer: number = 5
): { startIdx: number; endIdx: number } {
  const bufferedTop = topDepth - buffer;
  const bufferedBottom = bottomDepth + buffer;
  const startIdx = Math.max(0, findDepthIndex(depths, bufferedTop) - 1);
  const endIdx = Math.min(depths.length - 1, findDepthIndex(depths, bufferedBottom) + 1);
  return { startIdx, endIdx };
}

/**
 * Round depth to nearest centimeter.
 */
export function roundDepth(depth: number): number {
  return Math.round(depth * 100) / 100;
}

/**
 * Format depth for display (e.g., "2500.00 m MD").
 */
export function formatDepth(depth: number, unit: string = 'm'): string {
  return `${depth.toFixed(2)} ${unit}`;
}
