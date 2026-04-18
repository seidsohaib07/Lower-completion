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
  const removeEquipment = useCompletionStore((s) => s.removeEquipment);
  const duplicateEquipment = useCompletionStore((s) => s.duplicateEquipment);
  const selection = useSelectionStore((s) => s.selection);
  const selectEquipment = useSelectionStore((s) => s.selectEquipment);
  const clearSelection = useSelectionStore((s) => s.clearSelection);
  const drag = useSelectionStore((s) => s.drag);
  const activeTool = useUIStore((s) => s.activeTool);
  const theme = useUIStore((s) => s.theme);
  const { onMouseDown, onMouseMove, onMouseUp } = useDragSelect();

  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    equipmentId: string;
  } | null>(null);

  useEffect(() => {
    if (!contextMenu) return;
    const onDocClick = () => setContextMenu(null);
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [contextMenu]);

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
        const requestedTop = depth - moveState.grabOffsetMD;
        // Clamp against other non-blank equipment so the drag preview shows
        // the real landing position (can only slide through blank pipe).
        const obstacles = items.filter(
          (i) => i.id !== moveState.id && i.type !== 'blank_pipe'
        );
        let minTop = -Infinity;
        let maxTop = Infinity;
        for (const o of obstacles) {
          if (o.bottomMD <= moveState.currentTopMD + 0.001) {
            if (o.bottomMD > minTop) minTop = o.bottomMD;
          } else if (o.topMD >= moveState.currentTopMD + moveState.length - 0.001) {
            if (o.topMD - moveState.length < maxTop) maxTop = o.topMD - moveState.length;
          }
        }
        const clampedTop = Math.max(minTop, Math.min(maxTop, requestedTop));
        setMoveState((prev) => (prev ? { ...prev, currentTopMD: clampedTop } : prev));
        return;
      }
      if (activeTool === 'select') return;
      onMouseMove(e, rect);
    },
    [activeTool, onMouseMove, moveState, pixelToDepth, items]
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

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      if (!containerRef.current) return;
      e.preventDefault();
      const rect = containerRef.current.getBoundingClientRect();
      const depth = pixelToDepth(e.clientY - rect.top);
      const hit = hitTestEquipment(items, depth);
      if (!hit || hit.type === 'blank_pipe') {
        setContextMenu(null);
        return;
      }
      selectEquipment(hit.id);
      setContextMenu({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        equipmentId: hit.id,
      });
    },
    [items, pixelToDepth, selectEquipment]
  );

  const cursor = moveState ? 'grabbing' : activeTool === 'select' ? 'default' : 'crosshair';

  return (
    <div
      ref={containerRef}
      className="flex-1 h-full canvas-container relative"
      style={{ cursor }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => moveState && setMoveState(null)}
      onContextMenu={handleContextMenu}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <canvas ref={canvasRef} className="block" />
      {contextMenu && (
        <div
          className="absolute rounded shadow-lg border text-[11px] py-1 z-40"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
            background: 'var(--color-surface)',
            borderColor: 'var(--color-border)',
            color: 'var(--color-text)',
            minWidth: 140,
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <button
            className="block w-full text-left px-3 py-1 hover:bg-[rgba(148,163,184,0.15)]"
            onClick={() => {
              duplicateEquipment(contextMenu.equipmentId);
              setContextMenu(null);
            }}
          >
            Duplicate
          </button>
          <button
            className="block w-full text-left px-3 py-1 hover:bg-[rgba(148,163,184,0.15)]"
            onClick={() => {
              // Arming move: select item and let user drag via the existing move handler.
              selectEquipment(contextMenu.equipmentId);
              const eq = items.find((i) => i.id === contextMenu.equipmentId);
              if (eq) {
                setMoveState({
                  id: eq.id,
                  grabOffsetMD: 0,
                  currentTopMD: eq.topMD,
                  length: eq.length,
                });
              }
              setContextMenu(null);
            }}
          >
            Move (drag to reposition)
          </button>
          <div className="border-t my-0.5" style={{ borderColor: 'var(--color-border)' }} />
          <button
            className="block w-full text-left px-3 py-1 hover:bg-[rgba(239,68,68,0.2)]"
            style={{ color: 'var(--color-danger)' }}
            onClick={() => {
              removeEquipment(contextMenu.equipmentId);
              clearSelection();
              setContextMenu(null);
            }}
          >
            Remove
          </button>
        </div>
      )}
    </div>
  );
}
