import { drawHorizontalLine, drawVerticalLine, getCanvasTheme } from './render-utils';

export function renderGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  topDepth: number,
  bottomDepth: number,
  pixelsPerMeter: number,
  verticalDivisions: number = 5
) {
  const theme = getCanvasTheme();
  // Horizontal grid lines (depth intervals)
  const depthRange = bottomDepth - topDepth;
  const gridSpacing = calculateGridSpacing(depthRange);

  const firstGridDepth = Math.ceil(topDepth / gridSpacing) * gridSpacing;
  for (let depth = firstGridDepth; depth <= bottomDepth; depth += gridSpacing) {
    const y = (depth - topDepth) * pixelsPerMeter;
    const isMajor = Math.abs(depth % (gridSpacing * 5)) < 0.01;
    drawHorizontalLine(ctx, y, 0, width, isMajor ? theme.gridMajor : theme.gridMinor, isMajor ? 0.8 : 0.3);
  }

  // Vertical grid lines (track scale divisions)
  for (let i = 1; i < verticalDivisions; i++) {
    const x = (width * i) / verticalDivisions;
    drawVerticalLine(ctx, x, 0, height, theme.gridMinor, 0.3);
  }
}

/**
 * Calculate appropriate grid line spacing based on visible depth range.
 */
function calculateGridSpacing(depthRange: number): number {
  const targetLines = 20;
  const rawSpacing = depthRange / targetLines;

  const niceIntervals = [0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500];
  for (const interval of niceIntervals) {
    if (interval >= rawSpacing) return interval;
  }
  return 500;
}
