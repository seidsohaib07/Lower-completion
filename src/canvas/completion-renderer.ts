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
  _openHoleDiameter: number = DEFAULT_OPEN_HOLE_DIAMETER
) {
  // Background
  ctx.fillStyle = '#111827';
  ctx.fillRect(0, 0, width, height);

  const centerX = width * 0.45;
  const wellboreWidth = Math.min(width * 0.35, 120);
  const pipeWidth = wellboreWidth * 0.55;
  const halfWellbore = wellboreWidth / 2;

  // Draw open hole walls
  drawOpenHoleWalls(ctx, centerX, halfWellbore, height);

  // Draw depth grid lines
  drawDepthGrid(ctx, width, height, topDepth, bottomDepth, pixelsPerMeter);

  // Draw equipment items
  for (const item of items) {
    const yTop = (item.topMD - topDepth) * pixelsPerMeter;
    const yBottom = (item.bottomMD - topDepth) * pixelsPerMeter;

    // Skip items outside visible range
    if (yBottom < -50 || yTop > height + 50) continue;

    const isSelected = item.id === selectedId;
    const drawer = SHAPE_DRAWERS[item.type];
    if (drawer) {
      drawer(ctx, centerX, yTop, yBottom, wellboreWidth, pipeWidth, isSelected, item);
    }

    // Depth labels on the right side
    drawDepthLabel(ctx, centerX + halfWellbore + 10, yTop, item.topMD, item.type);
    if (item.type !== 'blank_pipe' || yBottom - yTop > 30) {
      drawDepthLabel(ctx, centerX + halfWellbore + 10, yBottom, item.bottomMD, item.type);
    }

    // Equipment type label for non-blank items
    if (item.type !== 'blank_pipe') {
      drawDashedLine(ctx, centerX + halfWellbore + 5, yTop, centerX + halfWellbore + 5, yBottom, EQUIPMENT_COLORS[item.type], [3, 3]);
    }
  }
}

function drawOpenHoleWalls(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  halfWellbore: number,
  height: number
) {
  // Wavy open hole wall texture
  ctx.strokeStyle = '#78716c';
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

  // Formation fill (subtle texture between wall and edge)
  ctx.fillStyle = 'rgba(120, 113, 108, 0.05)';
  ctx.fillRect(0, 0, centerX - halfWellbore - 3, height);
  ctx.fillRect(centerX + halfWellbore + 3, 0, centerX - halfWellbore, height);
}

function drawDepthGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  _height: number,
  topDepth: number,
  bottomDepth: number,
  pixelsPerMeter: number
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

  const firstDepth = Math.ceil(topDepth / gridSpacing) * gridSpacing;
  for (let depth = firstDepth; depth <= bottomDepth; depth += gridSpacing) {
    const y = (depth - topDepth) * pixelsPerMeter;
    drawHorizontalLine(ctx, y, 0, width, '#1e293b', 0.3);
  }
}

function drawDepthLabel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  depth: number,
  _type: string
) {
  drawText(ctx, depth.toFixed(1), x, y, {
    color: '#94a3b8',
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
