import type {
  CompletionEquipment,
  SlidingSleeve,
  ICDScreen,
  AICDScreen,
  SwellPacker,
  Perforation,
  FracSleeve,
  Centralizer,
  ProductionPacker,
  LinerHanger,
  FloatShoe,
  FloatCollar,
  EquipmentType,
} from '../types';
import { EQUIPMENT_COLORS } from '../constants';

export interface ShapeContext {
  ctx: CanvasRenderingContext2D;
  centerX: number;
  yTop: number;
  yBottom: number;
  wellboreWidth: number;
  pipeWidth: number;
  isSelected: boolean;
  equipment: CompletionEquipment;
}

type ShapeDrawer = (s: ShapeContext) => void;

const SELECT_COLOR = '#f59e0b';

function hex(c: string, alpha: number) {
  // accept #rrggbb
  if (c.startsWith('#') && c.length === 7) {
    const r = parseInt(c.slice(1, 3), 16);
    const g = parseInt(c.slice(3, 5), 16);
    const b = parseInt(c.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }
  return c;
}

function pipeColor(isSelected: boolean, base: string) {
  return isSelected ? SELECT_COLOR : base;
}

// --- Shared helpers --------------------------------------------------------

function drawInnerPipeBore(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  yTop: number,
  yBottom: number,
  pipeWidth: number,
  color: string
) {
  const halfPipe = pipeWidth / 2;
  // Pipe walls (two parallel lines)
  ctx.fillStyle = color;
  ctx.fillRect(centerX - halfPipe, yTop, 2.5, yBottom - yTop);
  ctx.fillRect(centerX + halfPipe - 2.5, yTop, 2.5, yBottom - yTop);
  // Hollow bore fill
  ctx.fillStyle = hex(color, 0.06);
  ctx.fillRect(centerX - halfPipe + 2.5, yTop, pipeWidth - 5, yBottom - yTop);
}

function drawCouplings(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  yTop: number,
  yBottom: number,
  width: number,
  color: string
) {
  const couplingH = 3;
  const halfW = width / 2;
  ctx.fillStyle = color;
  ctx.fillRect(centerX - halfW, yTop, width, couplingH);
  ctx.fillRect(centerX - halfW, yBottom - couplingH, width, couplingH);
}

function gradientVertical(
  ctx: CanvasRenderingContext2D,
  yTop: number,
  yBottom: number,
  c1: string,
  c2: string
) {
  const g = ctx.createLinearGradient(0, yTop, 0, yBottom);
  g.addColorStop(0, c1);
  g.addColorStop(0.5, c2);
  g.addColorStop(1, c1);
  return g;
}

// --- Equipment drawers -----------------------------------------------------

function drawBlankPipe(s: ShapeContext) {
  const { ctx, centerX, yTop, yBottom, pipeWidth, isSelected } = s;
  const color = pipeColor(isSelected, EQUIPMENT_COLORS.blank_pipe);
  drawInnerPipeBore(ctx, centerX, yTop, yBottom, pipeWidth, color);

  // Joint marks every 12.2m visually (subtle dashes on walls)
  if (yBottom - yTop > 40) {
    const step = Math.max(12, (yBottom - yTop) / 5);
    ctx.strokeStyle = hex(color, 0.4);
    ctx.lineWidth = 1;
    for (let y = yTop + step; y < yBottom; y += step) {
      ctx.beginPath();
      ctx.moveTo(centerX - pipeWidth / 2 - 2, y);
      ctx.lineTo(centerX - pipeWidth / 2 + 2, y);
      ctx.moveTo(centerX + pipeWidth / 2 - 2, y);
      ctx.lineTo(centerX + pipeWidth / 2 + 2, y);
      ctx.stroke();
    }
  }
}

function drawSwellPacker(s: ShapeContext) {
  const { ctx, centerX, yTop, yBottom, wellboreWidth, pipeWidth, isSelected, equipment } = s;
  const base = EQUIPMENT_COLORS.swell_packer;
  const color = pipeColor(isSelected, base);
  const height = yBottom - yTop;
  const packer = equipment as SwellPacker;

  // Inner pipe through the packer
  drawInnerPipeBore(ctx, centerX, yTop, yBottom, pipeWidth, '#475569');

  // Rubber element (wider, reaching toward OH wall)
  const elementW = wellboreWidth * 0.95;
  const halfElem = elementW / 2;

  // Taper at top and bottom to suggest swelled profile
  const taper = Math.min(height * 0.15, 10);
  ctx.beginPath();
  ctx.moveTo(centerX - pipeWidth / 2 - 2, yTop);
  ctx.lineTo(centerX - halfElem, yTop + taper);
  ctx.lineTo(centerX - halfElem, yBottom - taper);
  ctx.lineTo(centerX - pipeWidth / 2 - 2, yBottom);
  ctx.lineTo(centerX + pipeWidth / 2 + 2, yBottom);
  ctx.lineTo(centerX + halfElem, yBottom - taper);
  ctx.lineTo(centerX + halfElem, yTop + taper);
  ctx.lineTo(centerX + pipeWidth / 2 + 2, yTop);
  ctx.closePath();

  // Gradient fill (rubber)
  ctx.fillStyle = gradientVertical(ctx, yTop, yBottom, hex(base, 0.35), hex(base, 0.65));
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Cross-hatch (rubber texture)
  ctx.save();
  ctx.clip();
  ctx.strokeStyle = hex(color, 0.55);
  ctx.lineWidth = 0.7;
  const spacing = 5;
  for (let i = -Math.ceil(height / spacing); i < Math.ceil(elementW / spacing) + Math.ceil(height / spacing); i++) {
    const x1 = centerX - halfElem + i * spacing;
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

  // Label
  if (height > 18) {
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const label = packer.swellMedium === 'oil' ? 'SP-O' : packer.swellMedium === 'dual' ? 'SP-D' : 'SP-W';
    ctx.fillText(label, centerX, yTop + height / 2);
  }
}

function drawSandScreen(s: ShapeContext) {
  const { ctx, centerX, yTop, yBottom, pipeWidth, isSelected } = s;
  const base = EQUIPMENT_COLORS.sand_screen;
  const color = pipeColor(isSelected, base);
  const height = yBottom - yTop;
  const screenW = pipeWidth * 1.35;
  const halfScr = screenW / 2;

  // Gauge rings (top and bottom)
  drawCouplings(ctx, centerX, yTop, yBottom, screenW + 6, color);

  // Main body (wire wrap)
  ctx.fillStyle = hex(base, 0.18);
  ctx.fillRect(centerX - halfScr, yTop + 3, screenW, height - 6);

  // Horizontal wire-wrap lines (fine)
  ctx.strokeStyle = hex(color, 0.85);
  ctx.lineWidth = 0.6;
  const spacing = 2.5;
  for (let y = yTop + 4; y < yBottom - 4; y += spacing) {
    ctx.beginPath();
    ctx.moveTo(centerX - halfScr, y);
    ctx.lineTo(centerX + halfScr, y);
    ctx.stroke();
  }

  // Vertical support ribs
  ctx.strokeStyle = hex(color, 0.5);
  ctx.lineWidth = 0.8;
  for (let i = -2; i <= 2; i++) {
    const x = centerX + (i * screenW) / 5;
    ctx.beginPath();
    ctx.moveTo(x, yTop + 3);
    ctx.lineTo(x, yBottom - 3);
    ctx.stroke();
  }

  // Outer border
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.2;
  ctx.strokeRect(centerX - halfScr, yTop + 3, screenW, height - 6);

  // Inner bore overlay
  drawInnerPipeBore(ctx, centerX, yTop, yBottom, pipeWidth, hex(color, 0.9));
}

function drawICDScreen(s: ShapeContext) {
  // Render as sand screen with ICD chamber at top (nozzles)
  drawSandScreen(s);
  const { ctx, centerX, yTop, yBottom, pipeWidth, isSelected, equipment } = s;
  const height = yBottom - yTop;
  const icd = equipment as ICDScreen;
  const chamberH = Math.min(height * 0.18, 14);
  const chamberW = pipeWidth * 1.5;
  const halfCh = chamberW / 2;
  const base = EQUIPMENT_COLORS.icd_screen;
  const color = pipeColor(isSelected, base);

  // Chamber (darker band near top)
  ctx.fillStyle = hex(color, 0.9);
  ctx.fillRect(centerX - halfCh, yTop, chamberW, chamberH);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.2;
  ctx.strokeRect(centerX - halfCh, yTop, chamberW, chamberH);

  // Nozzle holes (circles)
  const n = Math.min(icd.nozzleCount ?? 4, 6);
  ctx.fillStyle = '#fef08a';
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n;
    const x = centerX - halfCh + t * chamberW;
    ctx.beginPath();
    ctx.arc(x, yTop + chamberH / 2, 1.6, 0, Math.PI * 2);
    ctx.fill();
  }

  if (chamberH > 8) {
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 8px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ICD', centerX, yTop + chamberH / 2);
  }
}

function drawAICDScreen(s: ShapeContext) {
  drawSandScreen(s);
  const { ctx, centerX, yTop, yBottom, pipeWidth, isSelected, equipment } = s;
  const height = yBottom - yTop;
  const aicd = equipment as AICDScreen;
  const chamberH = Math.min(height * 0.18, 14);
  const chamberW = pipeWidth * 1.5;
  const halfCh = chamberW / 2;
  const base = EQUIPMENT_COLORS.aicd_screen;
  const color = pipeColor(isSelected, base);

  ctx.fillStyle = hex(color, 0.9);
  ctx.fillRect(centerX - halfCh, yTop, chamberW, chamberH);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.2;
  ctx.strokeRect(centerX - halfCh, yTop, chamberW, chamberH);

  // AICD disk symbol
  ctx.fillStyle = '#fde68a';
  const diskY = yTop + chamberH / 2;
  ctx.beginPath();
  ctx.arc(centerX - halfCh + chamberW * 0.28, diskY, 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(centerX - halfCh + chamberW * 0.72, diskY, 2.2, 0, Math.PI * 2);
  ctx.fill();

  if (chamberH > 8) {
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 8px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`AICD ${aicd.autonomousRating ?? ''}`, centerX, diskY);
  }
}

function drawSlidingSleeve(s: ShapeContext) {
  const { ctx, centerX, yTop, yBottom, pipeWidth, isSelected, equipment } = s;
  const height = yBottom - yTop;
  const sleeve = equipment as SlidingSleeve;
  const base = EQUIPMENT_COLORS.sliding_sleeve;
  const color = pipeColor(isSelected, base);

  const sleeveW = pipeWidth * 1.25;
  const halfS = sleeveW / 2;

  // Main body (metallic sleeve)
  ctx.fillStyle = gradientVertical(ctx, yTop, yBottom, hex(base, 0.35), hex(base, 0.7));
  ctx.fillRect(centerX - halfS, yTop, sleeveW, height);

  // Top/bottom flanges
  ctx.fillStyle = color;
  ctx.fillRect(centerX - halfS - 2, yTop, sleeveW + 4, 3);
  ctx.fillRect(centerX - halfS - 2, yBottom - 3, sleeveW + 4, 3);

  // Port windows (ovals on left and right)
  const portH = Math.min(height * 0.45, 20);
  const portW = Math.max(3, sleeveW * 0.18);
  const portY = yTop + (height - portH) / 2;

  const openFill = sleeve.position === 'open' ? '#fef08a' : '#1e293b';

  for (const side of [-1, 1]) {
    const px = centerX + side * (halfS * 0.55) - portW / 2;
    ctx.fillStyle = openFill;
    ctx.fillRect(px, portY, portW, portH);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.strokeRect(px, portY, portW, portH);
  }

  // Border
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(centerX - halfS, yTop, sleeveW, height);

  // Inner bore
  drawInnerPipeBore(ctx, centerX, yTop + 3, yBottom - 3, pipeWidth * 0.8, '#334155');

  if (height > 16) {
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 8px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const lbl = sleeve.sleeveType === 'hydraulic' ? 'HSV' : 'SSD';
    ctx.fillText(lbl, centerX, yTop + height / 2);
  }
}

function drawPerforation(s: ShapeContext) {
  const { ctx, centerX, yTop, yBottom, wellboreWidth, pipeWidth, isSelected, equipment } = s;
  const base = EQUIPMENT_COLORS.perforation;
  const color = pipeColor(isSelected, base);
  const height = yBottom - yTop;
  const perf = equipment as Perforation;

  // Pipe walls
  drawInnerPipeBore(ctx, centerX, yTop, yBottom, pipeWidth, '#64748b');

  // Perforation holes + tunnels into formation
  const spf = perf.shotDensity ?? 6;
  const shotsPerMeter = spf * 3.28084;
  const totalShots = Math.max(4, Math.round(height / 10 * shotsPerMeter * 0.05)); // visual density
  const count = Math.min(totalShots, Math.max(6, Math.floor(height / 4)));
  const halfWell = wellboreWidth / 2;
  const halfPipe = pipeWidth / 2;

  ctx.strokeStyle = color;
  ctx.lineWidth = 1.1;
  ctx.fillStyle = color;

  for (let i = 0; i < count; i++) {
    const t = (i + 0.5) / count;
    const y = yTop + t * height;
    const side = i % 2 === 0 ? -1 : 1;
    const startX = centerX + side * halfPipe;
    const endX = centerX + side * halfWell * 1.15;

    // Tunnel
    ctx.beginPath();
    ctx.moveTo(startX, y);
    ctx.lineTo(endX, y);
    ctx.stroke();

    // Charge residue circle at end
    ctx.beginPath();
    ctx.arc(endX, y, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Label band
  if (height > 18) {
    ctx.fillStyle = hex(base, 0.8);
    ctx.fillRect(centerX - halfPipe, yTop, pipeWidth, 4);
    ctx.fillRect(centerX - halfPipe, yBottom - 4, pipeWidth, 4);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 8px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${spf} SPF`, centerX, yTop + height / 2);
  }
}

function drawFracSleeve(s: ShapeContext) {
  const { ctx, centerX, yTop, yBottom, pipeWidth, isSelected, equipment } = s;
  const height = yBottom - yTop;
  const frac = equipment as FracSleeve;
  const base = EQUIPMENT_COLORS.frac_sleeve;
  const color = pipeColor(isSelected, base);

  const w = pipeWidth * 1.3;
  const halfW = w / 2;

  ctx.fillStyle = gradientVertical(ctx, yTop, yBottom, hex(base, 0.4), hex(base, 0.7));
  ctx.fillRect(centerX - halfW, yTop, w, height);

  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(centerX - halfW, yTop, w, height);

  // Ball seat (diamond in center)
  const cy = yTop + height / 2;
  const sz = Math.min(height * 0.3, 8);
  ctx.fillStyle = '#fde68a';
  ctx.beginPath();
  ctx.moveTo(centerX, cy - sz);
  ctx.lineTo(centerX + sz * 0.7, cy);
  ctx.lineTo(centerX, cy + sz);
  ctx.lineTo(centerX - sz * 0.7, cy);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.stroke();

  // Ports (slits on each side, top and bottom)
  ctx.fillStyle = '#1e293b';
  const slitH = Math.min(3, height * 0.08);
  for (const yy of [yTop + height * 0.2, yBottom - height * 0.2 - slitH]) {
    ctx.fillRect(centerX - halfW + 2, yy, w - 4, slitH);
  }

  if (height > 20) {
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 8px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`FRC${frac.stage ? '-' + frac.stage : ''}`, centerX, yBottom - 8);
  }
}

function drawCentralizer(s: ShapeContext) {
  const { ctx, centerX, yTop, yBottom, wellboreWidth, pipeWidth, isSelected, equipment } = s;
  const height = yBottom - yTop;
  const centr = equipment as Centralizer;
  const base = EQUIPMENT_COLORS.centralizer;
  const color = pipeColor(isSelected, base);

  drawInnerPipeBore(ctx, centerX, yTop, yBottom, pipeWidth, '#64748b');

  const maxOutW = wellboreWidth * 0.9;
  const halfMax = maxOutW / 2;
  const halfPipe = pipeWidth / 2;
  const cy = yTop + height / 2;

  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;

  if (centr.centralizerType === 'bow_spring') {
    // Curved bow springs on each side
    ctx.beginPath();
    ctx.moveTo(centerX - halfPipe, yTop + 2);
    ctx.quadraticCurveTo(centerX - halfMax, cy, centerX - halfPipe, yBottom - 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(centerX + halfPipe, yTop + 2);
    ctx.quadraticCurveTo(centerX + halfMax, cy, centerX + halfPipe, yBottom - 2);
    ctx.stroke();

    // Extra bows
    ctx.strokeStyle = hex(color, 0.6);
    ctx.beginPath();
    ctx.moveTo(centerX - halfPipe, yTop + height * 0.2);
    ctx.quadraticCurveTo(centerX - halfMax * 0.9, cy, centerX - halfPipe, yBottom - height * 0.2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(centerX + halfPipe, yTop + height * 0.2);
    ctx.quadraticCurveTo(centerX + halfMax * 0.9, cy, centerX + halfPipe, yBottom - height * 0.2);
    ctx.stroke();
  } else {
    // Rigid blades
    ctx.fillStyle = color;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(centerX + side * halfPipe, yTop + 3);
      ctx.lineTo(centerX + side * halfMax, cy);
      ctx.lineTo(centerX + side * halfPipe, yBottom - 3);
      ctx.closePath();
      ctx.fill();
    }
  }

  // End rings
  ctx.fillStyle = color;
  ctx.fillRect(centerX - halfPipe - 3, yTop, pipeWidth + 6, 3);
  ctx.fillRect(centerX - halfPipe - 3, yBottom - 3, pipeWidth + 6, 3);
}

function drawProductionPacker(s: ShapeContext) {
  const { ctx, centerX, yTop, yBottom, wellboreWidth, pipeWidth, isSelected, equipment } = s;
  const height = yBottom - yTop;
  const pk = equipment as ProductionPacker;
  const base = EQUIPMENT_COLORS.production_packer;
  const color = pipeColor(isSelected, base);

  drawInnerPipeBore(ctx, centerX, yTop, yBottom, pipeWidth, '#334155');

  const elemW = wellboreWidth * 0.95;
  const halfE = elemW / 2;
  const halfPipe = pipeWidth / 2;
  const taper = Math.min(height * 0.18, 10);

  // Slip/cones (top and bottom trapezoids)
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(centerX - halfPipe, yTop);
  ctx.lineTo(centerX + halfPipe, yTop);
  ctx.lineTo(centerX + halfE, yTop + taper);
  ctx.lineTo(centerX - halfE, yTop + taper);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(centerX - halfPipe, yBottom);
  ctx.lineTo(centerX + halfPipe, yBottom);
  ctx.lineTo(centerX + halfE, yBottom - taper);
  ctx.lineTo(centerX - halfE, yBottom - taper);
  ctx.closePath();
  ctx.fill();

  // Middle packing element (solid rubber block)
  ctx.fillStyle = gradientVertical(
    ctx,
    yTop + taper,
    yBottom - taper,
    hex(base, 0.5),
    hex(base, 0.85)
  );
  ctx.fillRect(centerX - halfE, yTop + taper, elemW, height - taper * 2);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(centerX - halfE, yTop + taper, elemW, height - taper * 2);

  // Slip teeth marks
  ctx.fillStyle = hex(color, 0.9);
  for (let i = 0; i < 4; i++) {
    const yy = yTop + taper + 3 + i * 3;
    ctx.fillRect(centerX - halfE, yy, elemW, 1);
    const yy2 = yBottom - taper - 3 - i * 3;
    ctx.fillRect(centerX - halfE, yy2, elemW, 1);
  }

  if (height > 20) {
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const lbl = pk.packerType === 'permanent' ? 'PP' : pk.packerType === 'retrievable' ? 'RP' : 'HS-PP';
    ctx.fillText(lbl, centerX, yTop + height / 2);
  }
}

function drawLinerHanger(s: ShapeContext) {
  const { ctx, centerX, yTop, yBottom, wellboreWidth, pipeWidth, isSelected, equipment } = s;
  const height = yBottom - yTop;
  const lh = equipment as LinerHanger;
  const base = EQUIPMENT_COLORS.liner_hanger;
  const color = pipeColor(isSelected, base);

  drawInnerPipeBore(ctx, centerX, yTop, yBottom, pipeWidth, '#1e293b');

  const outerW = wellboreWidth * 0.92;
  const halfO = outerW / 2;
  const halfPipe = pipeWidth / 2;

  // Slip teeth (triangles biting outward)
  ctx.fillStyle = color;
  const teeth = 5;
  for (let i = 0; i < teeth; i++) {
    const ty = yTop + 4 + (i * (height - 8)) / teeth;
    const th = Math.min(8, (height - 8) / teeth);
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(centerX + side * halfPipe, ty);
      ctx.lineTo(centerX + side * halfO, ty + th / 2);
      ctx.lineTo(centerX + side * halfPipe, ty + th);
      ctx.closePath();
      ctx.fill();
    }
  }

  // Central mandrel body
  ctx.fillStyle = hex(base, 0.35);
  ctx.fillRect(centerX - halfPipe, yTop, pipeWidth, height);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.2;
  ctx.strokeRect(centerX - halfPipe, yTop, pipeWidth, height);

  if (height > 20) {
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 8px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const lbl = lh.hangerType === 'expandable' ? 'ELH' : lh.hangerType === 'mechanical' ? 'MLH' : 'HLH';
    ctx.fillText(lbl, centerX, yTop + height / 2);
  }
}

function drawFloatShoe(s: ShapeContext) {
  const { ctx, centerX, yTop, yBottom, pipeWidth, isSelected, equipment } = s;
  const height = yBottom - yTop;
  const fs = equipment as FloatShoe;
  const base = EQUIPMENT_COLORS.float_shoe;
  const color = pipeColor(isSelected, base);

  const halfPipe = pipeWidth / 2;

  // Bullet-nose body
  ctx.fillStyle = gradientVertical(ctx, yTop, yBottom, hex(base, 0.6), hex(base, 0.9));
  ctx.beginPath();
  ctx.moveTo(centerX - halfPipe, yTop);
  ctx.lineTo(centerX + halfPipe, yTop);
  ctx.lineTo(centerX + halfPipe, yBottom - height * 0.3);
  ctx.quadraticCurveTo(centerX + halfPipe * 0.7, yBottom, centerX, yBottom);
  ctx.quadraticCurveTo(centerX - halfPipe * 0.7, yBottom, centerX - halfPipe, yBottom - height * 0.3);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Valve indicator (circle inside)
  if (fs.shoeType === 'float') {
    ctx.fillStyle = '#fca5a5';
    ctx.beginPath();
    ctx.arc(centerX, yTop + height * 0.4, Math.min(5, pipeWidth * 0.2), 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  if (height > 14) {
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 8px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SHOE', centerX, yTop + height * 0.25);
  }
}

function drawFloatCollar(s: ShapeContext) {
  const { ctx, centerX, yTop, yBottom, pipeWidth, isSelected, equipment } = s;
  const height = yBottom - yTop;
  const fc = equipment as FloatCollar;
  const base = EQUIPMENT_COLORS.float_collar;
  const color = pipeColor(isSelected, base);

  const w = pipeWidth * 1.12;
  const halfW = w / 2;

  ctx.fillStyle = hex(base, 0.6);
  ctx.fillRect(centerX - halfW, yTop, w, height);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.3;
  ctx.strokeRect(centerX - halfW, yTop, w, height);

  // Valve(s)
  ctx.fillStyle = '#fca5a5';
  const vCount = fc.valveType === 'double' ? 2 : 1;
  for (let i = 0; i < vCount; i++) {
    const cy = yTop + (height * (i + 1)) / (vCount + 1);
    ctx.beginPath();
    ctx.arc(centerX, cy, Math.min(4, w * 0.2), 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  if (height > 14) {
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 8px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('FC', centerX + halfW + 8, yTop + height / 2);
  }
}

function drawWashPipe(s: ShapeContext) {
  const { ctx, centerX, yTop, yBottom, pipeWidth, isSelected } = s;
  const base = EQUIPMENT_COLORS.wash_pipe;
  const color = pipeColor(isSelected, base);

  // Slightly narrower inner line
  const w = pipeWidth * 0.45;
  const halfW = w / 2;

  ctx.fillStyle = hex(base, 0.3);
  ctx.fillRect(centerX - halfW, yTop, w, yBottom - yTop);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.2;
  ctx.setLineDash([4, 3]);
  ctx.strokeRect(centerX - halfW, yTop, w, yBottom - yTop);
  ctx.setLineDash([]);
}

export const SHAPE_DRAWERS: Record<EquipmentType, ShapeDrawer> = {
  blank_pipe: drawBlankPipe,
  swell_packer: drawSwellPacker,
  sand_screen: drawSandScreen,
  icd_screen: drawICDScreen,
  aicd_screen: drawAICDScreen,
  sliding_sleeve: drawSlidingSleeve,
  perforation: drawPerforation,
  frac_sleeve: drawFracSleeve,
  centralizer: drawCentralizer,
  production_packer: drawProductionPacker,
  liner_hanger: drawLinerHanger,
  float_shoe: drawFloatShoe,
  float_collar: drawFloatCollar,
  wash_pipe: drawWashPipe,
};

// Legacy-compatible individual drawer exports with old signature
export function drawShape(
  type: EquipmentType,
  ctx: CanvasRenderingContext2D,
  centerX: number,
  yTop: number,
  yBottom: number,
  wellboreWidth: number,
  pipeWidth: number,
  isSelected: boolean,
  equipment: CompletionEquipment
) {
  const drawer = SHAPE_DRAWERS[type];
  if (drawer) drawer({ ctx, centerX, yTop, yBottom, wellboreWidth, pipeWidth, isSelected, equipment });
}
