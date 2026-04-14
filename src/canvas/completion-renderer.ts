import type { CompletionEquipment } from '../types';
import { SHAPE_DRAWERS } from './equipment-shapes';
import { drawText, drawHorizontalLine, drawDashedLine } from './render-utils';
import { EQUIPMENT_COLORS, DEFAULT_OPEN_HOLE_DIAMETER } from '../constants';

export function renderCompletionSchematic(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  topDepth: number,
  bottomDepth: number,
  pixelsPerMeter: number,
  items: CompletionEquipment[],
  selectedId: string | null,
  _openHoleDiameter: number = DEFAULT_OPEN_HOLE_DIAMETER,
  theme: 'light' | 'dark' = 'dark'
) {
  const bg = theme === 'dark' ? '#111827' : '#f8fafc';
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  const centerX = width * 0.45;
  const wellboreWidth = Math.min(width * 0.35, 120);
  const pipeWidth = wellboreWidth * 0.55;
  const halfWellbore = wellboreWidth / 2;

  drawOpenHoleWalls(ctx, centerX, halfWellbore, height, theme);
  drawDepthGrid(ctx, width, height, topDepth, bottomDepth, pixelsPerMeter, theme);

  for (const item of items) {
    const yTop = (item.topMD - topDepth) * pixelsPerMeter;
    const yBottom = (item.bottomMD - topDepth) * pixelsPerMeter;
    if (yBottom < -50 || yTop > height + 50) continue;

    const isSelected = item.id === selectedId;
    const drawer = SHAPE_DRAWERS[item.type];
    if (drawer) {
      drawer({ ctx, centerX, yTop, yBottom, wellboreWidth, pipeWidth, isSelected, equipment: item });
    }

    drawDepthLabel(ctx, centerX + halfWellbore + 10, yTop, item.topMD, theme);
    if (item.type !== 'blank_pipe' || yBottom - yTop > 30) {
      drawDepthLabel(ctx, centerX + halfWellbore + 10, yBottom, item.bottomMD, theme);
    }
    if (item.type !== 'blank_pipe') {
      drawDashedLine(
        ctx,
        centerX + halfWellbore + 5,
        yTop,
        centerX + halfWellbore + 5,
        yBottom,
        EQUIPMENT_COLORS[item.type],
        [3, 3]
      );
    }
  }
}

function drawOpenHoleWalls(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  halfWellbore: number,
  height: number,
  theme: 'light' | 'dark'
) {
  const wallColor = theme === 'dark' ? '#78716c' : '#a8a29e';
  const fillColor = theme === 'dark' ? 'rgba(120, 113, 108, 0.05)' : 'rgba(120, 113, 108, 0.08)';

  ctx.strokeStyle = wallColor;
  ctx.lineWidth = 2;

  // Left wall
  ctx.beginPath();
  for (let y = 0; y < height; y += 2) {
    const wobble = Math.sin(y * 0.15) * 2 + Math.sin(y * 0.07) * 1;
    const x = centerX - halfWellbore + wobble;
    if (y === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Right wall
  ctx.beginPath();
  for (let y = 0; y < height; y += 2) {
    const wobble = Math.sin(y * 0.15 + 1) * 2 + Math.sin(y * 0.07 + 2) * 1;
    const x = centerX + halfWellbore + wobble;
    if (y === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  ctx.fillStyle = fillColor;
  ctx.fillRect(0, 0, centerX - halfWellbore - 3, height);
  ctx.fillRect(centerX + halfWellbore + 3, 0, centerX - halfWellbore, height);
}

function drawDepthGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  _height: number,
  topDepth: number,
  bottomDepth: number,
  pixelsPerMeter: number,
  theme: 'light' | 'dark'
) {
  const depthRange = bottomDepth - topDepth;
  const niceIntervals = [0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500];
  let gridSpacing = 10;
  for (const interval of niceIntervals) {
    if (depthRange / interval < 30) {
      gridSpacing = interval;
      break;
    }
  }

  const gridColor = theme === 'dark' ? '#1e293b' : '#e2e8f0';
  const firstDepth = Math.ceil(topDepth / gridSpacing) * gridSpacing;
  for (let depth = firstDepth; depth <= bottomDepth; depth += gridSpacing) {
    const y = (depth - topDepth) * pixelsPerMeter;
    drawHorizontalLine(ctx, y, 0, width, gridColor, 0.3);
  }
}

function drawDepthLabel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  depth: number,
  theme: 'light' | 'dark'
) {
  const color = theme === 'dark' ? '#94a3b8' : '#475569';
  drawText(ctx, depth.toFixed(1), x, y, {
    color,
    font: '9px Inter, system-ui, sans-serif',
    align: 'left',
    baseline: 'middle',
  });
}

export function renderSelectionOverlay(
  ctx: CanvasRenderingContext2D,
  width: number,
  topDepth: number,
  pixelsPerMeter: number,
  selectionTopMD: number,
  selectionBottomMD: number
) {
  const yTop = (selectionTopMD - topDepth) * pixelsPerMeter;
  const yBottom = (selectionBottomMD - topDepth) * pixelsPerMeter;

  ctx.fillStyle = 'rgba(245, 158, 11, 0.15)';
  ctx.fillRect(0, yTop, width, yBottom - yTop);

  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 3]);
  ctx.strokeRect(0, yTop, width, yBottom - yTop);
  ctx.setLineDash([]);
}
