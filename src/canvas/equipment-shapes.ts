import type { CompletionEquipment, SlidingSleeve } from '../types';
import { EQUIPMENT_COLORS } from '../constants';

type ShapeDrawer = (
  ctx: CanvasRenderingContext2D,
  centerX: number,
  yTop: number,
  yBottom: number,
  wellboreWidth: number,
  pipeWidth: number,
  isSelected: boolean,
  equipment: CompletionEquipment
) => void;

export function drawBlankPipe(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  yTop: number,
  yBottom: number,
  _wellboreWidth: number,
  pipeWidth: number,
  isSelected: boolean,
  _equipment: CompletionEquipment
) {
  const halfPipe = pipeWidth / 2;
  const color = isSelected ? '#f59e0b' : EQUIPMENT_COLORS.blank_pipe;

  // Pipe walls
  ctx.fillStyle = color;
  ctx.fillRect(centerX - halfPipe, yTop, 3, yBottom - yTop);
  ctx.fillRect(centerX + halfPipe - 3, yTop, 3, yBottom - yTop);

  // Inner fill (darker)
  ctx.fillStyle = isSelected ? 'rgba(245, 158, 11, 0.1)' : 'rgba(100, 116, 139, 0.05)';
  ctx.fillRect(centerX - halfPipe + 3, yTop, pipeWidth - 6, yBottom - yTop);
}

export function drawSwellPacker(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  yTop: number,
  yBottom: number,
  wellboreWidth: number,
  _pipeWidth: number,
  isSelected: boolean,
  _equipment: CompletionEquipment
) {
  const color = isSelected ? '#f59e0b' : EQUIPMENT_COLORS.swell_packer;
  const height = yBottom - yTop;

  // Rubber element (wider, reaching toward OH wall)
  const elementWidth = wellboreWidth * 0.85;
  const halfElement = elementWidth / 2;

  // Body fill
  ctx.fillStyle = isSelected ? 'rgba(245, 158, 11, 0.3)' : 'rgba(220, 38, 38, 0.3)';
  ctx.fillRect(centerX - halfElement, yTop, elementWidth, height);

  // Cross-hatch pattern
  ctx.strokeStyle = color;
  ctx.lineWidth = 0.8;
  const spacing = 6;
  ctx.save();
  ctx.beginPath();
  ctx.rect(centerX - halfElement, yTop, elementWidth, height);
  ctx.clip();

  for (let i = -Math.ceil(height / spacing); i < Math.ceil(elementWidth / spacing) + Math.ceil(height / spacing); i++) {
    const x1 = centerX - halfElement + i * spacing;
    ctx.beginPath();
    ctx.moveTo(x1, yTop);
    ctx.lineTo(x1 + height, yBottom);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x1, yBottom);
    ctx.lineTo(x1 + height, yTop);
    ctx.stroke();
  }
  ctx.restore();

  // Border
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.strokeRect(centerX - halfElement, yTop, elementWidth, height);

  // Label
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 9px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (height > 14) {
    ctx.fillText('SP', centerX, yTop + height / 2);
  }
}

export function drawSandScreen(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  yTop: number,
  yBottom: number,
  _wellboreWidth: number,
  pipeWidth: number,
  isSelected: boolean,
  _equipment: CompletionEquipment
) {
  const color = isSelected ? '#f59e0b' : EQUIPMENT_COLORS.sand_screen;
  const height = yBottom - yTop;
  const screenWidth = pipeWidth * 1.3;
  const halfScreen = screenWidth / 2;

  // Screen body fill
  ctx.fillStyle = isSelected ? 'rgba(245, 158, 11, 0.15)' : 'rgba(37, 99, 235, 0.15)';
  ctx.fillRect(centerX - halfScreen, yTop, screenWidth, height);

  // Horizontal wire-wrap lines
  ctx.strokeStyle = color;
  ctx.lineWidth = 0.6;
  const lineSpacing = 3;
  for (let y = yTop + lineSpacing; y < yBottom; y += lineSpacing) {
    ctx.beginPath();
    ctx.moveTo(centerX - halfScreen, y);
    ctx.lineTo(centerX + halfScreen, y);
    ctx.stroke();
  }

  // Border
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(centerX - halfScreen, yTop, screenWidth, height);

  // Gauge rings at top and bottom
  const gaugeWidth = screenWidth + 6;
  ctx.fillStyle = color;
  ctx.fillRect(centerX - gaugeWidth / 2, yTop, gaugeWidth, 3);
  ctx.fillRect(centerX - gaugeWidth / 2, yBottom - 3, gaugeWidth, 3);
}

export function drawSlidingSleeve(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  yTop: number,
  yBottom: number,
  _wellboreWidth: number,
  pipeWidth: number,
  isSelected: boolean,
  equipment: CompletionEquipment
) {
  const color = isSelected ? '#f59e0b' : EQUIPMENT_COLORS.sliding_sleeve;
  const height = yBottom - yTop;
  const sleeveWidth = pipeWidth * 1.15;
  const halfSleeve = sleeveWidth / 2;

  // Body fill
  ctx.fillStyle = isSelected ? 'rgba(245, 158, 11, 0.2)' : 'rgba(22, 163, 74, 0.2)';
  ctx.fillRect(centerX - halfSleeve, yTop, sleeveWidth, height);

  // Border
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(centerX - halfSleeve, yTop, sleeveWidth, height);

  // Port indicators (small triangles on each side)
  const portY = yTop + height / 2;
  const portSize = Math.min(6, height / 4);

  // Left ports
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(centerX - halfSleeve, portY - portSize);
  ctx.lineTo(centerX - halfSleeve - portSize, portY);
  ctx.lineTo(centerX - halfSleeve, portY + portSize);
  ctx.closePath();
  ctx.fill();

  // Right ports
  ctx.beginPath();
  ctx.moveTo(centerX + halfSleeve, portY - portSize);
  ctx.lineTo(centerX + halfSleeve + portSize, portY);
  ctx.lineTo(centerX + halfSleeve, portY + portSize);
  ctx.closePath();
  ctx.fill();

  // Type label
  if (height > 14) {
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 8px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText((equipment as SlidingSleeve).sleeveType, centerX, portY);
  }
}

export const SHAPE_DRAWERS: Record<string, ShapeDrawer> = {
  blank_pipe: drawBlankPipe,
  swell_packer: drawSwellPacker,
  sand_screen: drawSandScreen,
  sliding_sleeve: drawSlidingSleeve,
};
