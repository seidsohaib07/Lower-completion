import { create } from 'zustand';
import type { SelectionState, DragState } from '../types';

interface SelectionStoreState {
  selection: SelectionState;
  drag: DragState;

  selectEquipment: (equipmentId: string) => void;
  selectDepthInterval: (topMD: number, bottomMD: number) => void;
  clearSelection: () => void;
  startDrag: (depth: number) => void;
  updateDrag: (depth: number) => void;
  endDrag: () => { topMD: number; bottomMD: number } | null;
}

export const useSelectionStore = create<SelectionStoreState>((set, get) => ({
  selection: { type: 'none' },
  drag: { isDragging: false },

  selectEquipment: (equipmentId) => {
    set({ selection: { type: 'equipment', equipmentId } });
  },

  selectDepthInterval: (topMD, bottomMD) => {
    set({ selection: { type: 'depth_interval', topMD, bottomMD } });
  },

  clearSelection: () => {
    set({ selection: { type: 'none' } });
  },

  startDrag: (depth) => {
    set({ drag: { isDragging: true, startDepth: depth, currentDepth: depth } });
  },

  updateDrag: (depth) => {
    set((s) => ({ drag: { ...s.drag, currentDepth: depth } }));
  },

  endDrag: () => {
    const { drag } = get();
    if (!drag.isDragging || drag.startDepth === undefined || drag.currentDepth === undefined) {
      set({ drag: { isDragging: false } });
      return null;
    }

    const topMD = Math.min(drag.startDepth, drag.currentDepth);
    const bottomMD = Math.max(drag.startDepth, drag.currentDepth);

    set({
      drag: { isDragging: false },
      selection: { type: 'depth_interval', topMD, bottomMD },
    });

    return { topMD, bottomMD };
  },
}));
