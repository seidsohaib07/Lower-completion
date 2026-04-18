import { create } from 'zustand';
import type { ActiveTool, Theme } from '../types';

interface UIState {
  activeTool: ActiveTool;
  showProperties: boolean;
  showTally: boolean;
  showToolbox: boolean;
  panelSplit: number; // 0-1, fraction of width for left panel
  leftPanelVisible: boolean;
  rightPanelVisible: boolean;
  theme: Theme;

  setActiveTool: (tool: ActiveTool) => void;
  toggleProperties: () => void;
  toggleTally: () => void;
  toggleToolbox: () => void;
  setPanelSplit: (split: number) => void;
  toggleLeftPanel: () => void;
  toggleRightPanel: () => void;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

function applyThemeToDocument(theme: Theme) {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.theme = theme;
}

const initialTheme: Theme = (() => {
  if (typeof window === 'undefined') return 'dark';
  const stored = localStorage.getItem('complete-it:theme');
  if (stored === 'light' || stored === 'dark') return stored;
  return 'light';
})();

applyThemeToDocument(initialTheme);

export const useUIStore = create<UIState>((set) => ({
  activeTool: 'select',
  showProperties: true,
  showTally: false,
  showToolbox: true,
  panelSplit: 0.5,
  leftPanelVisible: true,
  rightPanelVisible: true,
  theme: initialTheme,

  setActiveTool: (tool) => set({ activeTool: tool }),
  toggleProperties: () => set((s) => ({ showProperties: !s.showProperties })),
  toggleTally: () => set((s) => ({ showTally: !s.showTally })),
  toggleToolbox: () => set((s) => ({ showToolbox: !s.showToolbox })),
  setPanelSplit: (split) => set({ panelSplit: Math.max(0.2, Math.min(0.8, split)) }),
  toggleLeftPanel: () => set((s) => ({ leftPanelVisible: !s.leftPanelVisible })),
  toggleRightPanel: () => set((s) => ({ rightPanelVisible: !s.rightPanelVisible })),
  toggleTheme: () =>
    set((s) => {
      const theme: Theme = s.theme === 'dark' ? 'light' : 'dark';
      applyThemeToDocument(theme);
      try {
        localStorage.setItem('complete-it:theme', theme);
      } catch {}
      return { theme };
    }),
  setTheme: (theme) => {
    applyThemeToDocument(theme);
    try {
      localStorage.setItem('complete-it:theme', theme);
    } catch {}
    set({ theme });
  },
}));
