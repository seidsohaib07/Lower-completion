export function renderDragOverlay(
  ctx: CanvasRenderingContext2D,
  width: number,
  yStart: number,
  yEnd: number
) {
  const yTop = Math.min(yStart, yEnd);
  const yBottom = Math.max(yStart, yEnd);

  ctx.fillStyle = 'rgba(245, 158, 11, 0.1)';
  ctx.fillRect(0, yTop, width, yBottom - yTop);

  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.strokeRect(0, yTop, width, yBottom - yTop);
  ctx.setLineDash([]);
}
