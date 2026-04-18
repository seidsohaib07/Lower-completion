import { renderGrid } from './grid-renderer';
import { valueToTrackPosition, isNullValue } from '../utils/log-processing';
import { getVisibleRange } from '../utils/depth-utils';
import { getCanvasTheme, drawHorizontalLine, drawText } from './render-utils';
import type { TrackConfig, LogCurve } from '../types';
import type { FormationMarker } from '../stores/log-data-store';

export function renderLogTrack(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  topDepth: number,
  bottomDepth: number,
  pixelsPerMeter: number,
  trackConfig: TrackConfig,
  curve: LogCurve | undefined,
  depthCurve: number[],
  formationMarkers?: FormationMarker[],
  showFormationMarkers?: boolean
) {
  const theme = getCanvasTheme();
  // Background
  ctx.fillStyle = theme.bg;
  ctx.fillRect(0, 0, width, height);

  // Grid
  renderGrid(ctx, width, height, topDepth, bottomDepth, pixelsPerMeter, trackConfig.gridLines);

  // Left/right borders
  ctx.strokeStyle = theme.border;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0.5, 0);
  ctx.lineTo(0.5, height);
  ctx.moveTo(width - 0.5, 0);
  ctx.lineTo(width - 0.5, height);
  ctx.stroke();

  if (!curve || depthCurve.length === 0) return;

  // Get visible data range
  const { startIdx, endIdx } = getVisibleRange(depthCurve, topDepth, bottomDepth, 5);

  // Draw the curve
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, width, height);
  ctx.clip();

  const padding = 4;
  const drawWidth = width - padding * 2;

  // Build path segments (break at null values)
  const segments: { x: number; y: number }[][] = [];
  let currentSegment: { x: number; y: number }[] = [];

  for (let i = startIdx; i <= endIdx; i++) {
    const value = curve.data[i];
    const depth = depthCurve[i];

    if (isNullValue(value, curve.nullValue)) {
      if (currentSegment.length > 0) {
        segments.push(currentSegment);
        currentSegment = [];
      }
      continue;
    }

    const normalizedX = valueToTrackPosition(value, trackConfig.scaleMin, trackConfig.scaleMax, trackConfig.scaleType);
    const x = padding + Math.max(0, Math.min(1, normalizedX)) * drawWidth;
    const y = (depth - topDepth) * pixelsPerMeter;

    currentSegment.push({ x, y });
  }
  if (currentSegment.length > 0) {
    segments.push(currentSegment);
  }

  // Draw fill areas
  if ((trackConfig.fillLeft || trackConfig.fillRight) && trackConfig.fillColor) {
    ctx.fillStyle = trackConfig.fillColor;
    for (const segment of segments) {
      if (segment.length < 2) continue;
      ctx.beginPath();

      if (trackConfig.fillLeft) {
        ctx.moveTo(padding, segment[0].y);
        for (const pt of segment) {
          ctx.lineTo(pt.x, pt.y);
        }
        ctx.lineTo(padding, segment[segment.length - 1].y);
      } else {
        ctx.moveTo(width - padding, segment[0].y);
        for (const pt of segment) {
          ctx.lineTo(pt.x, pt.y);
        }
        ctx.lineTo(width - padding, segment[segment.length - 1].y);
      }

      ctx.closePath();
      ctx.fill();
    }
  }

  // Draw curve line
  ctx.strokeStyle = trackConfig.color;
  ctx.lineWidth = 1.5;
  ctx.lineJoin = 'round';

  for (const segment of segments) {
    if (segment.length < 2) continue;
    ctx.beginPath();
    ctx.moveTo(segment[0].x, segment[0].y);
    for (let i = 1; i < segment.length; i++) {
      ctx.lineTo(segment[i].x, segment[i].y);
    }
    ctx.stroke();
  }

  // Formation markers
  if (showFormationMarkers && formationMarkers && formationMarkers.length > 0) {
    const markerColor = theme.isDark ? '#f59e0b' : '#b45309';
    for (const marker of formationMarkers) {
      const y = (marker.topMD - topDepth) * pixelsPerMeter;
      if (y < -20 || y > height + 20) continue;
      drawHorizontalLine(ctx, y, 0, width, markerColor, 1.2);
      if (marker.bottomMD !== undefined) {
        const yBot = (marker.bottomMD - topDepth) * pixelsPerMeter;
        if (yBot >= -20 && yBot <= height + 20) {
          drawHorizontalLine(ctx, yBot, 0, width, markerColor, 0.8);
        }
      }
    }
  }

  ctx.restore();
}
