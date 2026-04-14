import { drawText, drawHorizontalLine, getCanvasTheme } from './render-utils';

export function renderDepthTrack(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  topDepth: number,
  bottomDepth: number,
  pixelsPerMeter: number,
  depthLabel: string = 'MD',
  labelFormatter?: (md: number) => number
) {
  const theme = getCanvasTheme();
  // Background
  ctx.fillStyle = theme.bgDeep;
  ctx.fillRect(0, 0, width, height);

  // Right border
  ctx.strokeStyle = theme.gridMajor;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(width - 0.5, 0);
  ctx.lineTo(width - 0.5, height);
  ctx.stroke();

  const depthRange = bottomDepth - topDepth;
  const gridSpacing = calculateDepthGridSpacing(depthRange);

  const firstGridDepth = Math.ceil(topDepth / gridSpacing) * gridSpacing;

  for (let depth = firstGridDepth; depth <= bottomDepth; depth += gridSpacing) {
    const y = (depth - topDepth) * pixelsPerMeter;
    const isMajor = Math.abs(depth % (gridSpacing * 5)) < 0.01 || gridSpacing >= 10;

    // Tick mark
    const tickLength = isMajor ? 8 : 4;
    drawHorizontalLine(ctx, y, width - tickLength, width, theme.textMuted, isMajor ? 1 : 0.5);

    // Depth label for major ticks
    if (isMajor) {
      const displayed = labelFormatter ? labelFormatter(depth) : depth;
      drawText(ctx, displayed.toFixed(displayed % 1 === 0 ? 0 : 1), width - 12, y, {
        color: theme.textPrimary,
        font: '10px Inter, system-ui, sans-serif',
        align: 'right',
        baseline: 'middle',
      });
    }
  }

  // Header
  drawText(ctx, depthLabel, width / 2, 6, {
    color: theme.textMuted,
    font: 'bold 9px Inter, system-ui, sans-serif',
    align: 'center',
    baseline: 'top',
  });
  drawText(ctx, '(m)', width / 2, 16, {
    color: theme.textMuted,
    font: '8px Inter, system-ui, sans-serif',
    align: 'center',
    baseline: 'top',
  });
}

function calculateDepthGridSpacing(depthRange: number): number {
  const targetLines = 15;
  const rawSpacing = depthRange / targetLines;
  const niceIntervals = [0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500];
  for (const interval of niceIntervals) {
    if (interval >= rawSpacing) return interval;
  }
  return 500;
}
