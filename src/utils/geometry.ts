import type { CompletionEquipment } from '../types';

/**
 * Find which equipment item is at a given depth.
 */
export function hitTestEquipment(
  items: CompletionEquipment[],
  depthMD: number
): CompletionEquipment | null {
  for (const item of items) {
    if (depthMD >= item.topMD && depthMD <= item.bottomMD) {
      return item;
    }
  }
  return null;
}

/**
 * Snap a depth to the nearest equipment boundary.
 */
export function snapToEquipmentBoundary(
  items: CompletionEquipment[],
  depthMD: number,
  snapThreshold: number = 2.0 // meters
): number {
  let closest = depthMD;
  let minDist = snapThreshold;

  for (const item of items) {
    const distTop = Math.abs(depthMD - item.topMD);
    const distBottom = Math.abs(depthMD - item.bottomMD);

    if (distTop < minDist) {
      minDist = distTop;
      closest = item.topMD;
    }
    if (distBottom < minDist) {
      minDist = distBottom;
      closest = item.bottomMD;
    }
  }

  return closest;
}
