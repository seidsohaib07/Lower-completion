import { create } from 'zustand';
import type { ActiveTool } from '../types';

interface UIState {
  activeTool: ActiveTool;
  showProperties: boolean;
  showTally: boolean;
  panelSplit: number; // 0-1, fraction of width for left panel
  leftPanelVisible: boolean;
  rightPanelVisible: boolean;

  setActiveTool: (tool: ActiveTool) => void;
  toggleProperties: () => void;
  toggleTally: () => void;
  setPanelSplit: (split: number) => void;
  toggleLeftPanel: () => void;
  toggleRightPanel: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeTool: 'select',
  showProperties: true,
  showTally: false,
  panelSplit: 0.5,
  leftPanelVisible: true,
  rightPanelVisible: true,

  setActiveTool: (tool) => set({ activeTool: tool }),
  toggleProperties: () => set((s) => ({ showProperties: !s.showProperties })),
  toggleTally: () => set((s) => ({ showTally: !s.showTally })),
  setPanelSplit: (split) => set({ panelSplit: Math.max(0.2, Math.min(0.8, split)) }),
  toggleLeftPanel: () => set((s) => ({ leftPanelVisible: !s.leftPanelVisible })),
  toggleRightPanel: () => set((s) => ({ rightPanelVisible: !s.rightPanelVisible })),
}));
