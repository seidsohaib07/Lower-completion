import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { LogDataSet, TrackConfig } from '../types';
import { createDefaultTrackConfig } from '../constants';

interface LogDataState {
  logData: LogDataSet | null;
  tracks: TrackConfig[];

  setLogData: (data: LogDataSet) => void;
  clearLogData: () => void;
  addTrack: (curveName: string) => void;
  removeTrack: (id: string) => void;
  updateTrack: (id: string, updates: Partial<TrackConfig>) => void;
  reorderTracks: (fromIndex: number, toIndex: number) => void;
  autoCreateTracks: () => void;
}

export const useLogDataStore = create<LogDataState>((set, get) => ({
  logData: null,
  tracks: [],

  setLogData: (data) => {
    set({ logData: data });
    // Auto-create tracks for all curves
    get().autoCreateTracks();
  },

  clearLogData: () => {
    set({ logData: null, tracks: [] });
  },

  addTrack: (curveName) => {
    const id = uuidv4();
    const track = createDefaultTrackConfig(curveName, id);
    set((s) => ({ tracks: [...s.tracks, track] }));
  },

  removeTrack: (id) => {
    set((s) => ({ tracks: s.tracks.filter((t) => t.id !== id) }));
  },

  updateTrack: (id, updates) => {
    set((s) => ({
      tracks: s.tracks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    }));
  },

  reorderTracks: (fromIndex, toIndex) => {
    set((s) => {
      const tracks = [...s.tracks];
      const [moved] = tracks.splice(fromIndex, 1);
      tracks.splice(toIndex, 0, moved);
      return { tracks };
    });
  },

  autoCreateTracks: () => {
    const { logData } = get();
    if (!logData) return;

    const tracks: TrackConfig[] = logData.curves.map((curve) => {
      const id = uuidv4();
      return createDefaultTrackConfig(curve.name, id);
    });

    set({ tracks });
  },
}));
