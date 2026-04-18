import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { LogDataSet, TrackConfig } from '../types';
import { createDefaultTrackConfig } from '../constants';

export interface PdfOverlay {
  imageDataUrl: string;
  topMD: number;
  bottomMD: number;
  widthPx: number;
  heightPx: number;
}

export interface FormationMarker {
  name: string;
  topMD: number;
  bottomMD?: number;
}

interface LogDataState {
  logData: LogDataSet | null;
  tracks: TrackConfig[];
  pdfOverlay: PdfOverlay | null;
  formationMarkers: FormationMarker[];
  showFormationMarkers: boolean;

  setLogData: (data: LogDataSet) => void;
  clearLogData: () => void;
  setPdfOverlay: (overlay: PdfOverlay | null) => void;
  addTrack: (curveName: string) => void;
  removeTrack: (id: string) => void;
  updateTrack: (id: string, updates: Partial<TrackConfig>) => void;
  reorderTracks: (fromIndex: number, toIndex: number) => void;
  autoCreateTracks: () => void;
  addFormationMarkers: (markers: { name: string; topMD: number; bottomMD?: number }[]) => void;
  clearFormationMarkers: () => void;
  toggleFormationMarkers: () => void;
}

export const useLogDataStore = create<LogDataState>((set, get) => ({
  logData: null,
  tracks: [],
  pdfOverlay: null,
  formationMarkers: [],
  showFormationMarkers: true,

  setLogData: (data) => {
    set({ logData: data });
    // Auto-create tracks for all curves
    get().autoCreateTracks();
  },

  clearLogData: () => {
    set({ logData: null, tracks: [], pdfOverlay: null, formationMarkers: [] });
  },

  setPdfOverlay: (overlay) => set({ pdfOverlay: overlay }),

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

  addFormationMarkers: (markers) => {
    set((s) => ({ formationMarkers: [...s.formationMarkers, ...markers] }));
  },

  clearFormationMarkers: () => {
    set({ formationMarkers: [] });
  },

  toggleFormationMarkers: () => {
    set((s) => ({ showFormationMarkers: !s.showFormationMarkers }));
  },
}));
