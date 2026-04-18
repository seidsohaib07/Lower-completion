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
  Constrictor,
  Casing,
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

/** Horizontal metallic gradient: dark edge → bright centre → dark edge */
function metalGradH(
  ctx: CanvasRenderingContext2D,
  x: number,
  w: number,
  dark: string,
  light: string
) {
  const g = ctx.createLinearGradient(x, 0, x + w, 0);
  g.addColorStop(0,    dark);
  g.addColorStop(0.25, light);
  g.addColorStop(0.5,  light);
  g.addColorStop(0.75, hex(light, 0.6));
  g.addColorStop(1,    dark);
  return g;
}

/** Vertical gradient with a mid-highlight (for rubber/body elements). */
function gradientVertical(
  ctx: CanvasRenderingContext2D,
  yTop: number,
  yBottom: number,
  c1: string,
  c2: string
) {
  const g = ctx.createLinearGradient(0, yTop, 0, yBottom);
  g.addColorStop(0,   c1);
  g.addColorStop(0.5, c2);
  g.addColorStop(1,   c1);
  return g;
}

/**
 * Draw a metallic pipe segment with a horizontal shine gradient and thin
 * wall lines. This is the shared core for blank pipe, casing, tubing, etc.
 */
function drawMetallicPipe(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  yTop: number,
  yBottom: number,
  wallWidth: number,           // total outer width of the pipe
  wallThickness: number,       // thickness of each wall (px)
  dark: string,
  light: string
) {
  const halfW = wallWidth / 2;
  const h = yBottom - yTop;

  // Left wall
  const gL = metalGradH(ctx, centerX - halfW, wallThickness, dark, light);
  ctx.fillStyle = gL;
  ctx.fillRect(centerX - halfW, yTop, wallThickness, h);

  // Right wall
  const gR = metalGradH(ctx, centerX + halfW - wallThickness, wallThickness, dark, light);
  ctx.fillStyle = gR;
  ctx.fillRect(centerX + halfW - wallThickness, yTop, wallThickness, h);

  // Bore (dark fluid column)
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(centerX - halfW + wallThickness, yTop, wallWidth - wallThickness * 2, h);
}

function drawCouplings(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  yTop: number,
  yBottom: number,
  width: number,
  color: string
) {
  const couplingH = 4;
  const halfW = width / 2;
  const g = metalGradH(ctx, centerX - halfW, width, hex(color, 0.7), color);
  ctx.fillStyle = g;
  ctx.fillRect(centerX - halfW, yTop, width, couplingH);
  ctx.fillRect(centerX - halfW, yBottom - couplingH, width, couplingH);
}

function drawInnerPipeBore(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  yTop: number,
  yBottom: number,
  pipeWidth: number,
  color: string
) {
  // Keep for legacy callers — maps to metallic pipe with thin walls.
  drawMetallicPipe(ctx, centerX, yTop, yBottom, pipeWidth, 3, hex(color, 0.6), color);
}

// --- Equipment drawers -----------------------------------------------------

function drawCasing(s: ShapeContext) {
  const { ctx, centerX, yTop, yBottom, pipeWidth, isSelected, equipment } = s;
  const casing = equipment as Casing;
  const h = yBottom - yTop;
  const width = pipeWidth * 1.65;
  const halfW = width / 2;

  // Thick-walled metallic casing
  drawMetallicPipe(ctx, centerX, yTop, yBottom, width, 5, '#1a2535', '#9ab8cc');

  // Joint collars (heavier bands)
  if (h > 35) {
    const step = Math.max(22, h / 4);
    for (let y = yTop + step; y < yBottom - 4; y += step) {
      const cw = width + 7;
      const cx2 = centerX - cw / 2;
      const gc = metalGradH(ctx, cx2, cw, '#162030', '#b8d0e0');
      ctx.fillStyle = gc;
      ctx.fillRect(cx2, y - 2.5, cw, 5);
    }
  }

  if (h > 18) {
    ctx.fillStyle = isSelected ? SELECT_COLOR : 'rgba(180,210,230,0.7)';
    ctx.font = 'bold 8px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const cls = (casing.casingClass ?? 'production').slice(0, 3).toUpperCase();
    ctx.fillText(cls, centerX, yTop + h / 2);
  }
}

function drawTubing(s: ShapeContext) {
  const { ctx, centerX, yTop, yBottom, pipeWidth, isSelected } = s;
  const h = yBottom - yTop;
  const width = pipeWidth * 0.72;
  const halfW = width / 2;

  // Narrow metallic tubing
  drawMetallicPipe(ctx, centerX, yTop, yBottom, width, 2.5, '#1e2d3c', '#6a8fa8');

  // Collar ticks (lighter, denser spacing than casing)
  if (h > 24) {
    const step = Math.max(14, h / 6);
    for (let y = yTop + step; y < yBottom - 2; y += step) {
      const cw = width + 5;
      const cx2 = centerX - cw / 2;
      const gc = metalGradH(ctx, cx2, cw, '#182535', '#8aafc8');
      ctx.fillStyle = gc;
      ctx.fillRect(cx2, y - 1.5, cw, 3);
    }
  }

  if (isSelected) {
    ctx.strokeStyle = SELECT_COLOR;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(centerX - halfW - 1, yTop, width + 2, h);
  }
}

function drawPupJoint(s: ShapeContext) {
  const { ctx, centerX, yTop, yBottom, pipeWidth, isSelected } = s;
  const base = EQUIPMENT_COLORS.pup_joint;
  const color = pipeColor(isSelected, base);
  drawInnerPipeBore(ctx, centerX, yTop, yBottom, pipeWidth, color);
  // Dotted outer border to differentiate from blank pipe
  ctx.strokeStyle = hex(color, 0.6);
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 2]);
  const halfPipe = pipeWidth / 2;
  ctx.strokeRect(centerX - halfPipe, yTop, pipeWidth, yBottom - yTop);
  ctx.setLineDash([]);

  if (yBottom - yTop > 14) {
    ctx.fillStyle = color;
    ctx.font = 'bold 7px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('PUP', centerX + halfPipe + 4, yTop + (yBottom - yTop) / 2);
  }
}

function drawConstrictor(s: ShapeContext) {
  const { ctx, centerX, yTop, yBottom, wellboreWidth, pipeWidth, isSelected, equipment } = s;
  const base = EQUIPMENT_COLORS.constrictor;
  const color = pipeColor(isSelected, base);
  const con = equipment as Constrictor;
  const height = yBottom - yTop;

  // Draw pipe passing through
  drawInnerPipeBore(ctx, centerX, yTop, yBottom, pipeWidth, '#475569');

  // Constriction body (like a venturi - wider body, narrower internal neck)
  const bodyW = wellboreWidth * 0.85;
  const halfBody = bodyW / 2;
  const neckW = pipeWidth * 0.5;
  const halfNeck = neckW / 2;
  const taper = Math.min(height * 0.25, 12);

  ctx.beginPath();
  ctx.moveTo(centerX - halfBody, yTop);
  ctx.lineTo(centerX + halfBody, yTop);
  ctx.lineTo(centerX + halfBody, yTop + taper);
  ctx.lineTo(centerX + halfNeck, yTop + height / 2);
  ctx.lineTo(centerX + halfBody, yBottom - taper);
  ctx.lineTo(centerX + halfBody, yBottom);
  ctx.lineTo(centerX - halfBody, yBottom);
  ctx.lineTo(centerX - halfBody, yBottom - taper);
  ctx.lineTo(centerX - halfNeck, yTop + height / 2);
  ctx.lineTo(centerX - halfBody, yTop + taper);
  ctx.closePath();

  ctx.fillStyle = gradientVertical(ctx, yTop, yBottom, hex(base, 0.4), hex(base, 0.75));
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  if (height > 18) {
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 8px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const lbl = con.constrictionType === 'hydraulic' ? 'CON-H' : 'CON';
    ctx.fillText(lbl, centerX, yTop + height / 2);
  }
}

function drawBlankPipe(s: ShapeContext) {
  const { ctx, centerX, yTop, yBottom, pipeWidth, isSelected } = s;
  const base = EQUIPMENT_COLORS.blank_pipe;
  const h = yBottom - yTop;

  if (isSelected) {
    // Selection highlight ring
    ctx.strokeStyle = SELECT_COLOR;
    ctx.lineWidth = 2;
    ctx.strokeRect(centerX - pipeWidth / 2 - 1, yTop, pipeWidth + 2, h);
  }

  // Metallic steel pipe walls with highlight shine
  drawMetallicPipe(ctx, centerX, yTop, yBottom, pipeWidth, 4, '#2a3548', '#8baabf');

  // Joint couplings: wider band with a bright ridge
  if (h > 30) {
    const step = Math.max(18, h / 5);
    for (let y = yTop + step; y < yBottom - 4; y += step) {
      const cw = pipeWidth + 6;
      const cx2 = centerX - cw / 2;
      const gC = metalGradH(ctx, cx2, cw, '#1e2d40', '#b0c8e0');
      ctx.fillStyle = gC;
      ctx.fillRect(cx2, y - 2, cw, 4);
    }
  }

  // Accent colour tint if colour mode active
  if (!isSelected) {
    ctx.fillStyle = hex(base, 0.08);
    ctx.fillRect(centerX - pipeWidth / 2 + 4, yTop, pipeWidth - 8, h);
  }
}

function drawSwellPacker(s: ShapeContext) {
  const { ctx, centerX, yTop, yBottom, wellboreWidth, pipeWidth, isSelected, equipment } = s;
  const packer = equipment as SwellPacker;
  const height = yBottom - yTop;

  // Inner mandrel (metallic steel tube)
  drawMetallicPipe(ctx, centerX, yTop, yBottom, pipeWidth, 3, '#1e2d40', '#7a9ab5');

  // Rubber element — tapered ends reaching toward OH wall
  const elemW = wellboreWidth * 0.94;
  const halfE = elemW / 2;
  const taper = Math.min(height * 0.18, 12);

  ctx.beginPath();
  ctx.moveTo(centerX - pipeWidth / 2 - 1, yTop);
  ctx.lineTo(centerX - halfE, yTop + taper);
  ctx.lineTo(centerX - halfE, yBottom - taper);
  ctx.lineTo(centerX - pipeWidth / 2 - 1, yBottom);
  ctx.lineTo(centerX + pipeWidth / 2 + 1, yBottom);
  ctx.lineTo(centerX + halfE, yBottom - taper);
  ctx.lineTo(centerX + halfE, yTop + taper);
  ctx.lineTo(centerX + pipeWidth / 2 + 1, yTop);
  ctx.closePath();

  // Deep rubber gradient: near-black base → dark teal/grey highlight
  const rg = ctx.createLinearGradient(centerX - halfE, 0, centerX + halfE, 0);
  rg.addColorStop(0,    '#111418');
  rg.addColorStop(0.25, '#2a3a30');
  rg.addColorStop(0.5,  '#3c5242');
  rg.addColorStop(0.75, '#2a3a30');
  rg.addColorStop(1,    '#111418');
  ctx.fillStyle = rg;
  ctx.fill();

  if (isSelected) {
    ctx.strokeStyle = SELECT_COLOR;
    ctx.lineWidth = 2;
  } else {
    ctx.strokeStyle = '#4a6a58';
    ctx.lineWidth = 1.2;
  }
  ctx.stroke();

  // Fine diagonal ribbing (rubber texture)
  ctx.save();
  ctx.clip();
  ctx.strokeStyle = 'rgba(255,255,255,0.07)';
  ctx.lineWidth = 0.8;
  const sp = 4;
  for (let i = -Math.ceil(height / sp); i < Math.ceil(elemW / sp) + Math.ceil(height / sp); i++) {
    const x1 = centerX - halfE + i * sp;
    ctx.beginPath(); ctx.moveTo(x1, yTop); ctx.lineTo(x1 + height, yBottom); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x1, yBottom); ctx.lineTo(x1 + height, yTop); ctx.stroke();
  }
  ctx.restore();

  // Reflective highlight strip along the top edge of the rubber
  const hl = ctx.createLinearGradient(centerX - halfE, yTop + taper, centerX + halfE, yTop + taper);
  hl.addColorStop(0,   'rgba(255,255,255,0)');
  hl.addColorStop(0.4, 'rgba(255,255,255,0.14)');
  hl.addColorStop(1,   'rgba(255,255,255,0)');
  ctx.fillStyle = hl;
  ctx.fillRect(centerX - halfE, yTop + taper, elemW, Math.min(8, height * 0.12));

  if (height > 20) {
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
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
  const height = yBottom - yTop;
  const screenW = pipeWidth * 1.38;
  const halfScr = screenW / 2;
  const bodyTop = yTop + 4;
  const bodyBot = yBottom - 4;
  const bodyH = bodyBot - bodyTop;

  // Gauge rings (metallic collars top/bottom)
  const ringW = screenW + 8;
  drawCouplings(ctx, centerX, yTop, yBottom, ringW, '#8baabf');

  // Screen body — metallic stainless-steel mesh base colour
  const bodyGrad = ctx.createLinearGradient(centerX - halfScr, 0, centerX + halfScr, 0);
  bodyGrad.addColorStop(0,    '#1a2535');
  bodyGrad.addColorStop(0.15, '#3a5068');
  bodyGrad.addColorStop(0.5,  '#5a7890');
  bodyGrad.addColorStop(0.85, '#3a5068');
  bodyGrad.addColorStop(1,    '#1a2535');
  ctx.fillStyle = bodyGrad;
  ctx.fillRect(centerX - halfScr, bodyTop, screenW, bodyH);

  // Wire-wrap lines — fine horizontal wires (the "mesh")
  ctx.lineWidth = 0.5;
  const wireSpacing = 2.2;
  for (let y = bodyTop + 1; y < bodyBot - 1; y += wireSpacing) {
    const alpha = 0.55 + 0.25 * Math.sin((y - bodyTop) * 0.6);
    ctx.strokeStyle = `rgba(160, 200, 220, ${alpha})`;
    ctx.beginPath();
    ctx.moveTo(centerX - halfScr + 1, y);
    ctx.lineTo(centerX + halfScr - 1, y);
    ctx.stroke();
  }

  // Vertical support rods
  ctx.lineWidth = 0.9;
  ctx.strokeStyle = 'rgba(120,170,190,0.45)';
  const nRods = 6;
  for (let i = 0; i <= nRods; i++) {
    const rx = centerX - halfScr + (i / nRods) * screenW;
    ctx.beginPath();
    ctx.moveTo(rx, bodyTop);
    ctx.lineTo(rx, bodyBot);
    ctx.stroke();
  }

  // Perforation holes on the screen body (small dots representing flow slots)
  if (bodyH > 20) {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    const holeSpacingY = 5;
    const holeSpacingX = screenW / 7;
    for (let y = bodyTop + 4; y < bodyBot - 4; y += holeSpacingY) {
      const offset = ((Math.floor((y - bodyTop) / holeSpacingY) % 2) * holeSpacingX) / 2;
      for (let x = centerX - halfScr + 3 + offset; x < centerX + halfScr - 3; x += holeSpacingX) {
        ctx.beginPath();
        ctx.arc(x, y, 0.9, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // Outer border with selection highlight
  ctx.strokeStyle = isSelected ? SELECT_COLOR : '#7aaec8';
  ctx.lineWidth = isSelected ? 2 : 1.2;
  ctx.strokeRect(centerX - halfScr, bodyTop, screenW, bodyH);

  // Metallic inner mandrel pipe
  drawMetallicPipe(ctx, centerX, yTop, yBottom, pipeWidth, 3, '#1e2d40', '#7a9ab5');

  if (height > 22 && !isSelected) {
    ctx.fillStyle = 'rgba(180,220,240,0.75)';
    ctx.font = 'bold 8px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SS', centerX, yTop + height / 2);
  }
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
  casing: drawCasing,
  tubing: drawTubing,
  blank_pipe: drawBlankPipe,
  pup_joint: drawPupJoint,
  constrictor: drawConstrictor,
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
