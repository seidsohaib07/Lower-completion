import { useRef, useEffect, useCallback, useState } from 'react';
import { useCanvasRenderer } from '../../hooks/use-canvas-renderer';
import { renderCompletionSchematic, renderSelectionOverlay } from '../../canvas/completion-renderer';
import { renderDragOverlay } from '../../canvas/selection-overlay';
import { useViewportStore, useCompletionStore, useSelectionStore, useUIStore } from '../../stores';
import { useDragSelect } from '../../hooks/use-drag-select';
import { hitTestEquipment } from '../../utils/geometry';
import { toolToEquipmentType } from '../../types';
import type { EquipmentType, CompletionEquipment } from '../../types';

export function CompletionCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { canvasRef, width, height, requestRender } = useCanvasRenderer(containerRef);

  const topDepth = useViewportStore((s) => s.topDepth);
  const bottomDepth = useViewportStore((s) => s.bottomDepth);
  const pixelsPerMeter = useViewportStore((s) => s.pixelsPerMeter);
  const pixelToDepth = useViewportStore((s) => s.pixelToDepth);
  const items = useCompletionStore((s) => s.completionString.items);
  const replaceInterval = useCompletionStore((s) => s.replaceInterval);
  const placeAtDepth = useCompletionStore((s) => s.placeAtDepth);
  const moveEquipment = useCompletionStore((s) => s.moveEquipment);
  const selection = useSelectionStore((s) => s.selection);
  const selectEquipment = useSelectionStore((s) => s.selectEquipment);
  const clearSelection = useSelectionStore((s) => s.clearSelection);
  const drag = useSelectionStore((s) => s.drag);
  const activeTool = useUIStore((s) => s.activeTool);
  const theme = useUIStore((s) => s.theme);
  const { onMouseDown, onMouseMove, onMouseUp } = useDragSelect();

  // Move-state for dragging a placed equipment item
  const [moveState, setMoveState] = useState<{
    id: string;
    grabOffsetMD: number;
    currentTopMD: number;
    length: number;
  } | null>(null);

  const [dropIndicator, setDropIndicator] = useState<{ depth: number } | null>(null);

  useEffect(() => {
    if (width === 0 || height === 0) return;
    const selectedId =
      moveState?.id ??
      (selection.type === 'equipment' ? selection.equipmentId ?? null : null);

    requestRender((ctx, w, h) => {
      renderCompletionSchematic(ctx, w, h, topDepth, bottomDepth, pixelsPerMeter, items, selectedId, undefined, theme);

      if (selection.type === 'depth_interval' && selection.topMD !== undefined && selection.bottomMD !== undefined) {
        renderSelectionOverlay(ctx, w, topDepth, pixelsPerMeter, selection.topMD, selection.bottomMD);
      }
      if (drag.isDragging && drag.startDepth !== undefined && drag.currentDepth !== undefined) {
        const yStart = (drag.startDepth - topDepth) * pixelsPerMeter;
        const yCurrent = (drag.currentDepth - topDepth) * pixelsPerMeter;
        renderDragOverlay(ctx, w, yStart, yCurrent);
      }
      if (moveState) {
        const yTop = (moveState.currentTopMD - topDepth) * pixelsPerMeter;
        const yBot = (moveState.currentTopMD + moveState.length - topDepth) * pixelsPerMeter;
        ctx.fillStyle = 'rgba(245, 158, 11, 0.12)';
        ctx.fillRect(0, yTop, w, yBot - yTop);
        ctx.strokeStyle = '#f59e0b';
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 1.5;
        ctx.strokeRect(0, yTop, w, yBot - yTop);
        ctx.setLineDash([]);
      }
      if (dropIndicator) {
        const y = (dropIndicator.depth - topDepth) * pixelsPerMeter;
        ctx.strokeStyle = '#22c55e';
        ctx.setLineDash([6, 4]);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    });
  }, [width, height, topDepth, bottomDepth, pixelsPerMeter, items, selection, drag, requestRender, moveState, dropIndicator, theme]);

  const depthAtMouse = useCallback(
    (e: React.MouseEvent | React.DragEvent) => {
      if (!containerRef.current) return 0;
      const rect = containerRef.current.getBoundingClientRect();
      const localY = e.clientY - rect.top;
      return pixelToDepth(localY);
    },
    [pixelToDepth]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const depth = pixelToDepth(e.clientY - rect.top);

      if (activeTool === 'select') {
        const hit = hitTestEquipment(items, depth);
        if (hit && hit.type !== 'blank_pipe') {
          // Start move-drag
          selectEquipment(hit.id);
          const eq = hit as CompletionEquipment;
          setMoveState({
            id: eq.id,
            grabOffsetMD: depth - eq.topMD,
            currentTopMD: eq.topMD,
            length: eq.length,
          });
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
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      if (moveState) {
        const depth = pixelToDepth(e.clientY - rect.top);
        setMoveState((prev) => (prev ? { ...prev, currentTopMD: depth - prev.grabOffsetMD } : prev));
        return;
      }
      if (activeTool === 'select') return;
      onMouseMove(e, rect);
    },
    [activeTool, onMouseMove, moveState, pixelToDepth]
  );

  const handleMouseUp = useCallback(() => {
    if (moveState) {
      moveEquipment(moveState.id, moveState.currentTopMD);
      setMoveState(null);
      return;
    }
    if (activeTool === 'select') return;
    const interval = onMouseUp();
    if (interval && interval.bottomMD - interval.topMD > 0.1) {
      const equipType = toolToEquipmentType(activeTool);
      if (equipType) {
        replaceInterval(interval.topMD, interval.bottomMD, equipType);
      }
    }
  }, [activeTool, onMouseUp, replaceInterval, moveState, moveEquipment]);

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      if (!e.dataTransfer.types.includes('application/x-completion-equipment')) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      setDropIndicator({ depth: depthAtMouse(e) });
    },
    [depthAtMouse]
  );

  const handleDragLeave = useCallback(() => {
    setDropIndicator(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const type = e.dataTransfer.getData('application/x-completion-equipment') as EquipmentType;
      if (!type) return;
      const depth = depthAtMouse(e);
      placeAtDepth(depth, type);
      setDropIndicator(null);
    },
    [depthAtMouse, placeAtDepth]
  );

  const cursor = moveState ? 'grabbing' : activeTool === 'select' ? 'default' : 'crosshair';

  return (
    <div
      ref={containerRef}
      className="flex-1 h-full canvas-container"
      style={{ cursor }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => moveState && setMoveState(null)}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <canvas ref={canvasRef} className="block" />
    </div>
  );
}
