import type { CompletionEquipment } from '../types';
import { SHAPE_DRAWERS } from './equipment-shapes';
import { drawText, drawHorizontalLine, drawDashedLine } from './render-utils';
import { EQUIPMENT_COLORS, DEFAULT_OPEN_HOLE_DIAMETER } from '../constants';

/**
 * Draw the full completion schematic: sandstone formation background,
 * open-hole wellbore, wellhead icon at top of the visible range, and
 * the equipment string on top.
 */
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
  // Background canvas wash (keeps the theme consistent if the schematic
  // doesn't fully cover because of DPI rounding).
  ctx.fillStyle = theme === 'dark' ? '#111827' : '#f8fafc';
  ctx.fillRect(0, 0, width, height);

  const centerX = width * 0.45;
  const wellboreWidth = Math.min(width * 0.32, 110);
  const pipeWidth = wellboreWidth * 0.55;
  const halfWellbore = wellboreWidth / 2;

  drawSandstoneFormation(ctx, width, height, centerX, halfWellbore, theme);
  drawOpenHole(ctx, centerX, halfWellbore, height, theme);
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

/**
 * Paint a sandy reservoir formation on both sides of the wellbore using a
 * layered gradient with subtle stratified banding and speckle grains.
 */
function drawSandstoneFormation(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  centerX: number,
  halfWellbore: number,
  theme: 'light' | 'dark'
) {
  const sandTop = theme === 'dark' ? '#3f2f1e' : '#d6bc8b';
  const sandMid = theme === 'dark' ? '#5a4226' : '#e6cf9c';
  const sandBot = theme === 'dark' ? '#2b1f12' : '#c0a571';
  const grain = theme === 'dark' ? 'rgba(255, 230, 180, 0.08)' : 'rgba(92, 64, 24, 0.18)';
  const band = theme === 'dark' ? 'rgba(0, 0, 0, 0.18)' : 'rgba(120, 80, 30, 0.08)';

  const leftX = 0;
  const leftW = centerX - halfWellbore;
  const rightX = centerX + halfWellbore;
  const rightW = width - rightX;

  const grad = ctx.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0, sandTop);
  grad.addColorStop(0.5, sandMid);
  grad.addColorStop(1, sandBot);
  ctx.fillStyle = grad;
  ctx.fillRect(leftX, 0, leftW, height);
  ctx.fillRect(rightX, 0, rightW, height);

  // Stratification bands
  ctx.fillStyle = band;
  const strataStep = 28;
  for (let y = 0; y < height; y += strataStep) {
    const h = 3 + Math.sin(y * 0.03) * 1.5;
    ctx.fillRect(leftX, y, leftW, h);
    ctx.fillRect(rightX, y, rightW, h);
  }

  // Speckle grains (deterministic, based on a simple hash)
  ctx.fillStyle = grain;
  const step = 6;
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < leftW; x += step) {
      const h = Math.abs(Math.sin(x * 0.13 + y * 0.17) * 43758.5453) % 1;
      if (h < 0.35) {
        ctx.beginPath();
        ctx.arc(x + ((y % 2) ? step / 2 : 0), y, 0.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    for (let x = 0; x < rightW; x += step) {
      const h = Math.abs(Math.sin((x + 1000) * 0.13 + y * 0.17) * 43758.5453) % 1;
      if (h < 0.35) {
        ctx.beginPath();
        ctx.arc(rightX + x + ((y % 2) ? step / 2 : 0), y, 0.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // Subtle edge shadow where formation meets wellbore
  const leftShade = ctx.createLinearGradient(centerX - halfWellbore - 20, 0, centerX - halfWellbore, 0);
  leftShade.addColorStop(0, 'rgba(0,0,0,0)');
  leftShade.addColorStop(1, theme === 'dark' ? 'rgba(0,0,0,0.45)' : 'rgba(80,50,10,0.25)');
  ctx.fillStyle = leftShade;
  ctx.fillRect(centerX - halfWellbore - 20, 0, 20, height);

  const rightShade = ctx.createLinearGradient(
    centerX + halfWellbore,
    0,
    centerX + halfWellbore + 20,
    0
  );
  rightShade.addColorStop(0, theme === 'dark' ? 'rgba(0,0,0,0.45)' : 'rgba(80,50,10,0.25)');
  rightShade.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = rightShade;
  ctx.fillRect(centerX + halfWellbore, 0, 20, height);
}

/**
 * The open-hole annulus (drilling fluid in the wellbore). Walls are drawn
 * slightly rough to suggest a real borehole.
 */
function drawOpenHole(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  halfWellbore: number,
  height: number,
  theme: 'light' | 'dark'
) {
  // Mud fill
  const mudTop = theme === 'dark' ? '#0e1822' : '#dbe7f2';
  const mudMid = theme === 'dark' ? '#162334' : '#c7d8ea';
  const mudBot = theme === 'dark' ? '#0a121c' : '#b3cadf';
  const mud = ctx.createLinearGradient(centerX - halfWellbore, 0, centerX + halfWellbore, 0);
  mud.addColorStop(0, mudBot);
  mud.addColorStop(0.5, mudMid);
  mud.addColorStop(1, mudTop);
  ctx.fillStyle = mud;
  ctx.fillRect(centerX - halfWellbore, 0, halfWellbore * 2, height);

  // Rough wall paths
  const wallColor = theme === 'dark' ? '#8b7355' : '#6b5a3d';
  ctx.strokeStyle = wallColor;
  ctx.lineWidth = 1.2;

  ctx.beginPath();
  for (let y = 0; y < height; y += 2) {
    const wobble = Math.sin(y * 0.15) * 1.5 + Math.sin(y * 0.07) * 0.8;
    const x = centerX - halfWellbore + wobble;
    if (y === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  ctx.beginPath();
  for (let y = 0; y < height; y += 2) {
    const wobble = Math.sin(y * 0.15 + 1) * 1.5 + Math.sin(y * 0.07 + 2) * 0.8;
    const x = centerX + halfWellbore + wobble;
    if (y === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
}

/**
 * Draw a wellhead icon (christmas tree) above the hanger depth. This sits
 * above the start of the completion string to orient the viewer.
 */
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

  const gridColor = theme === 'dark' ? 'rgba(148, 163, 184, 0.08)' : 'rgba(71, 85, 105, 0.08)';
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
  const color = theme === 'dark' ? '#cbd5e1' : '#334155';
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
