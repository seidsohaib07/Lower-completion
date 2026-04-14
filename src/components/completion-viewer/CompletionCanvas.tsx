import { useRef, useEffect, useCallback } from 'react';
import { useCanvasRenderer } from '../../hooks/use-canvas-renderer';
import { renderCompletionSchematic, renderSelectionOverlay } from '../../canvas/completion-renderer';
import { renderDragOverlay } from '../../canvas/selection-overlay';
import { useViewportStore, useCompletionStore, useSelectionStore, useUIStore } from '../../stores';
import { useDragSelect } from '../../hooks/use-drag-select';
import { hitTestEquipment } from '../../utils/geometry';
import { toolToEquipmentType } from '../../types';

export function CompletionCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { canvasRef, width, height, requestRender } = useCanvasRenderer(containerRef);

  const topDepth = useViewportStore((s) => s.topDepth);
  const bottomDepth = useViewportStore((s) => s.bottomDepth);
  const pixelsPerMeter = useViewportStore((s) => s.pixelsPerMeter);
  const pixelToDepth = useViewportStore((s) => s.pixelToDepth);
  const items = useCompletionStore((s) => s.completionString.items);
  const replaceInterval = useCompletionStore((s) => s.replaceInterval);
  const selection = useSelectionStore((s) => s.selection);
  const selectEquipment = useSelectionStore((s) => s.selectEquipment);
  const clearSelection = useSelectionStore((s) => s.clearSelection);
  const drag = useSelectionStore((s) => s.drag);
  const activeTool = useUIStore((s) => s.activeTool);
  const { onMouseDown, onMouseMove, onMouseUp } = useDragSelect();

  useEffect(() => {
    if (width === 0 || height === 0) return;

    const selectedId = selection.type === 'equipment' ? selection.equipmentId ?? null : null;

    requestRender((ctx, w, h) => {
      renderCompletionSchematic(ctx, w, h, topDepth, bottomDepth, pixelsPerMeter, items, selectedId);

      // Draw selection overlay
      if (selection.type === 'depth_interval' && selection.topMD !== undefined && selection.bottomMD !== undefined) {
        renderSelectionOverlay(ctx, w, topDepth, pixelsPerMeter, selection.topMD, selection.bottomMD);
      }

      // Draw drag overlay
      if (drag.isDragging && drag.startDepth !== undefined && drag.currentDepth !== undefined) {
        const yStart = (drag.startDepth - topDepth) * pixelsPerMeter;
        const yCurrent = (drag.currentDepth - topDepth) * pixelsPerMeter;
        renderDragOverlay(ctx, w, yStart, yCurrent);
      }
    });
  }, [width, height, topDepth, bottomDepth, pixelsPerMeter, items, selection, drag, requestRender]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();

      if (activeTool === 'select') {
        const localY = e.clientY - rect.top;
        const depth = pixelToDepth(localY);
        const hit = hitTestEquipment(items, depth);
        if (hit && hit.type !== 'blank_pipe') {
          selectEquipment(hit.id);
        } else {
          clearSelection();
        }
      } else {
        onMouseDown(e, rect);
      }
    },
    [activeTool, items, pixelToDepth, selectEquipment, clearSelection, onMouseDown]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!containerRef.current || activeTool === 'select') return;
      const rect = containerRef.current.getBoundingClientRect();
      onMouseMove(e, rect);
    },
    [activeTool, onMouseMove]
  );

  const handleMouseUp = useCallback(() => {
    if (activeTool === 'select') return;

    const interval = onMouseUp();
    if (interval && interval.bottomMD - interval.topMD > 0.1) {
      const equipType = toolToEquipmentType(activeTool);
      if (equipType) {
        replaceInterval(interval.topMD, interval.bottomMD, equipType);
      }
    }
  }, [activeTool, onMouseUp, replaceInterval]);

  return (
    <div
      ref={containerRef}
      className="flex-1 h-full canvas-container cursor-crosshair"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <canvas ref={canvasRef} className="block" />
    </div>
  );
}
