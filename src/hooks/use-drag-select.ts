import { useCallback } from 'react';
import { useSelectionStore, useViewportStore } from '../stores';

export function useDragSelect() {
  const startDrag = useSelectionStore((s) => s.startDrag);
  const updateDrag = useSelectionStore((s) => s.updateDrag);
  const endDrag = useSelectionStore((s) => s.endDrag);
  const pixelToDepth = useViewportStore((s) => s.pixelToDepth);

  const onMouseDown = useCallback(
    (e: React.MouseEvent, containerRect: DOMRect) => {
      const localY = e.clientY - containerRect.top;
      const depth = pixelToDepth(localY);
      startDrag(depth);
    },
    [startDrag, pixelToDepth]
  );

  const onMouseMove = useCallback(
    (e: React.MouseEvent, containerRect: DOMRect) => {
      const localY = e.clientY - containerRect.top;
      const depth = pixelToDepth(localY);
      updateDrag(depth);
    },
    [updateDrag, pixelToDepth]
  );

  const onMouseUp = useCallback(() => {
    return endDrag();
  }, [endDrag]);

  return { onMouseDown, onMouseMove, onMouseUp };
}
