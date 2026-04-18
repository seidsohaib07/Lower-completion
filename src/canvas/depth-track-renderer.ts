import { drawText, drawHorizontalLine, getCanvasTheme } from './render-utils';
import type { FormationMarker } from '../stores/log-data-store';

export function renderDepthTrack(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  topDepth: number,
  bottomDepth: number,
  pixelsPerMeter: number,
  depthLabel: string = 'MD',
  labelFormatter?: (md: number) => number,
  formationMarkers?: FormationMarker[],
  showFormationMarkers?: boolean,
  secondaryLabel?: string,
  secondaryFormatter?: (md: number) => number
) {
  const theme = getCanvasTheme();
  ctx.fillStyle = theme.bgDeep;
  ctx.fillRect(0, 0, width, height);

  const hasDual = !!secondaryLabel && !!secondaryFormatter;
  const midX = hasDual ? Math.floor(width / 2) : width;

  // Column divider
  if (hasDual) {
    ctx.strokeStyle = theme.gridMajor;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(midX + 0.5, 0);
    ctx.lineTo(midX + 0.5, height);
    ctx.stroke();
  }

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
  const fontSize = hasDual ? '8px' : '10px';

  for (let depth = firstGridDepth; depth <= bottomDepth; depth += gridSpacing) {
    const y = (depth - topDepth) * pixelsPerMeter;
    const isMajor = Math.abs(depth % (gridSpacing * 5)) < 0.01 || gridSpacing >= 10;

    const tickLength = isMajor ? 6 : 3;
    drawHorizontalLine(ctx, y, midX - tickLength, midX, theme.textMuted, isMajor ? 0.8 : 0.4);

    if (isMajor) {
      const displayed = labelFormatter ? labelFormatter(depth) : depth;
      drawText(ctx, displayed.toFixed(displayed % 1 === 0 ? 0 : 1), midX - 4, y, {
        color: theme.textPrimary,
        font: `${fontSize} Inter, system-ui, sans-serif`,
        align: 'right',
        baseline: 'middle',
      });
    }

    if (hasDual && isMajor) {
      drawHorizontalLine(ctx, y, width - tickLength, width, theme.textMuted, isMajor ? 0.8 : 0.4);
      const secVal = secondaryFormatter!(depth);
      drawText(ctx, secVal.toFixed(secVal % 1 === 0 ? 0 : 1), width - 4, y, {
        color: theme.textPrimary,
        font: `${fontSize} Inter, system-ui, sans-serif`,
        align: 'right',
        baseline: 'middle',
      });
    }
  }

  // Headers
  const headerFont = hasDual ? 'bold 7px Inter, system-ui, sans-serif' : 'bold 9px Inter, system-ui, sans-serif';
  const subFont = hasDual ? '6px Inter, system-ui, sans-serif' : '8px Inter, system-ui, sans-serif';

  drawText(ctx, depthLabel, midX / 2, 5, { color: theme.textMuted, font: headerFont, align: 'center', baseline: 'top' });
  drawText(ctx, '(m)', midX / 2, hasDual ? 13 : 16, { color: theme.textMuted, font: subFont, align: 'center', baseline: 'top' });

  if (hasDual) {
    drawText(ctx, secondaryLabel!, midX + (width - midX) / 2, 5, { color: theme.textMuted, font: headerFont, align: 'center', baseline: 'top' });
    drawText(ctx, '(m)', midX + (width - midX) / 2, 13, { color: theme.textMuted, font: subFont, align: 'center', baseline: 'top' });
  }

  // Formation markers
  if (showFormationMarkers && formationMarkers && formationMarkers.length > 0) {
    const markerColor = theme.isDark ? '#f59e0b' : '#b45309';
    const markerTextColor = theme.isDark ? '#fbbf24' : '#92400e';
    for (const marker of formationMarkers) {
      const y = (marker.topMD - topDepth) * pixelsPerMeter;
      if (y < -20 || y > height + 20) continue;
      drawHorizontalLine(ctx, y, 0, width, markerColor, 1.2);
      drawText(ctx, marker.name, width - 4, y - 3, {
        color: markerTextColor,
        font: 'bold 7px Inter, system-ui, sans-serif',
        align: 'right',
        baseline: 'bottom',
      });
    }
  }
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
