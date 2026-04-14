/**
 * Shared canvas drawing helpers.
 */

export interface CanvasTheme {
  bg: string;            // track background
  bgDeep: string;        // depth-track / deep surface background
  textPrimary: string;   // primary label / axis text
  textMuted: string;     // secondary text
  gridMajor: string;     // major grid line
  gridMinor: string;     // minor grid line
  border: string;        // track / panel border
}

/**
 * Resolve current theme colors by reading CSS custom properties set on <html>.
 * Falls back to sensible defaults if computed styles are not accessible.
 */
export function getCanvasTheme(): CanvasTheme {
  if (typeof document === 'undefined') {
    return DARK_THEME;
  }
  const isLight = document.documentElement.getAttribute('data-theme') === 'light';
  const style = getComputedStyle(document.documentElement);
  const v = (name: string, fallback: string) =>
    (style.getPropertyValue(name).trim() || fallback);
  if (isLight) {
    return {
      bg: v('--color-log-bg', '#ffffff'),
      bgDeep: v('--color-surface-deep', '#e2e8f0'),
      textPrimary: v('--color-text', '#0f172a'),
      textMuted: v('--color-text-muted', '#475569'),
      gridMajor: '#94a3b8',
      gridMinor: '#cbd5e1',
      border: v('--color-border', '#cbd5e1'),
    };
  }
  return {
    bg: v('--color-log-bg', '#0b1220'),
    bgDeep: v('--color-surface-deep', '#0f172a'),
    textPrimary: v('--color-text', '#e2e8f0'),
    textMuted: v('--color-text-muted', '#94a3b8'),
    gridMajor: '#475569',
    gridMinor: '#1e293b',
    border: v('--color-border', '#334155'),
  };
}

const DARK_THEME: CanvasTheme = {
  bg: '#0b1220',
  bgDeep: '#0f172a',
  textPrimary: '#e2e8f0',
  textMuted: '#94a3b8',
  gridMajor: '#475569',
  gridMinor: '#1e293b',
  border: '#334155',
};

export function clearCanvas(ctx: CanvasRenderingContext2D, width: number, height: number, bgColor: string = '#1a1a2e') {
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, width, height);
}

export function drawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  options: {
    color?: string;
    font?: string;
    align?: CanvasTextAlign;
    baseline?: CanvasTextBaseline;
    maxWidth?: number;
  } = {}
) {
  ctx.fillStyle = options.color ?? '#e2e8f0';
  ctx.font = options.font ?? '11px Inter, system-ui, sans-serif';
  ctx.textAlign = options.align ?? 'left';
  ctx.textBaseline = options.baseline ?? 'middle';
  if (options.maxWidth) {
    ctx.fillText(text, x, y, options.maxWidth);
  } else {
    ctx.fillText(text, x, y);
  }
}

export function drawHorizontalLine(
  ctx: CanvasRenderingContext2D,
  y: number,
  x1: number,
  x2: number,
  color: string = '#334155',
  lineWidth: number = 0.5
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  ctx.moveTo(x1, Math.round(y) + 0.5);
  ctx.lineTo(x2, Math.round(y) + 0.5);
  ctx.stroke();
}

export function drawVerticalLine(
  ctx: CanvasRenderingContext2D,
  x: number,
  y1: number,
  y2: number,
  color: string = '#334155',
  lineWidth: number = 0.5
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  ctx.moveTo(Math.round(x) + 0.5, y1);
  ctx.lineTo(Math.round(x) + 0.5, y2);
  ctx.stroke();
}

export function drawDashedLine(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string = '#334155',
  dashPattern: number[] = [4, 4]
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 0.5;
  ctx.setLineDash(dashPattern);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.setLineDash([]);
}
