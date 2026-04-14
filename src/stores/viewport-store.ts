import { create } from 'zustand';
import {
  DEFAULT_PIXELS_PER_METER,
  MIN_PIXELS_PER_METER,
  MAX_PIXELS_PER_METER,
  ZOOM_FACTOR,
} from '../constants';

export type DepthMode = 'MD' | 'TVD_RKB' | 'TVD_MSL';

interface ViewportState {
  topDepth: number;
  bottomDepth: number;
  pixelsPerMeter: number;
  orientation: 'vertical' | 'horizontal';
  totalMinDepth: number;
  totalMaxDepth: number;

  // Depth reference mode (for display only; MD remains the internal coordinate)
  depthMode: DepthMode;
  rkbElevation: number;   // meters, RKB above sea level (TVD_MSL = TVD_RKB - rkbElevation assumed below, sign handled in conversion)
  tvdOffset: number;      // meters, simple MD->TVD_RKB offset for straight wells (TVD_RKB = MD - tvdOffset)

  // Actions
  setDepthRange: (top: number, bottom: number) => void;
  scrollBy: (deltaMD: number) => void;
  zoom: (factor: number, anchorDepth: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  fitToData: (minMD: number, maxMD: number, containerHeight: number) => void;
  setTotalRange: (minMD: number, maxMD: number) => void;
  toggleOrientation: () => void;
  setDepthMode: (mode: DepthMode) => void;
  setRkbElevation: (v: number) => void;
  setTvdOffset: (v: number) => void;
  /** Convert an MD depth to the currently-selected display mode. */
  mdToDisplay: (md: number) => number;
  depthToPixel: (md: number) => number;
  pixelToDepth: (px: number) => number;
}

export const useViewportStore = create<ViewportState>((set, get) => ({
  topDepth: 2500,
  bottomDepth: 3000,
  pixelsPerMeter: DEFAULT_PIXELS_PER_METER,
  orientation: 'vertical',
  totalMinDepth: 2500,
  totalMaxDepth: 3000,
  depthMode: 'MD',
  rkbElevation: 25,   // default North Sea RKB elevation (~25 m)
  tvdOffset: 0,       // MD==TVD_RKB by default (vertical well)

  setDepthMode: (mode) => set({ depthMode: mode }),
  setRkbElevation: (v) => set({ rkbElevation: v }),
  setTvdOffset: (v) => set({ tvdOffset: v }),
  mdToDisplay: (md) => {
    const { depthMode, tvdOffset, rkbElevation } = get();
    if (depthMode === 'MD') return md;
    const tvdRkb = md - tvdOffset;
    if (depthMode === 'TVD_RKB') return tvdRkb;
    // TVD_MSL: subtract the RKB elevation above mean sea level
    return tvdRkb - rkbElevation;
  },

  setDepthRange: (top, bottom) => {
    set({ topDepth: top, bottomDepth: bottom });
  },

  scrollBy: (deltaMD) => {
    const { topDepth, bottomDepth, totalMinDepth, totalMaxDepth } = get();
    const range = bottomDepth - topDepth;
    let newTop = topDepth + deltaMD;
    let newBottom = bottomDepth + deltaMD;

    // Clamp to total data bounds
    if (newTop < totalMinDepth) {
      newTop = totalMinDepth;
      newBottom = newTop + range;
    }
    if (newBottom > totalMaxDepth) {
      newBottom = totalMaxDepth;
      newTop = newBottom - range;
    }

    set({ topDepth: newTop, bottomDepth: newBottom });
  },

  zoom: (factor, anchorDepth) => {
    const { topDepth, bottomDepth, pixelsPerMeter, totalMinDepth, totalMaxDepth } = get();
    const newPPM = Math.max(MIN_PIXELS_PER_METER, Math.min(MAX_PIXELS_PER_METER, pixelsPerMeter * factor));

    // Keep anchor depth at the same pixel position
    const anchorFraction = (anchorDepth - topDepth) / (bottomDepth - topDepth);
    const newRange = (bottomDepth - topDepth) * (pixelsPerMeter / newPPM);
    let newTop = anchorDepth - anchorFraction * newRange;
    let newBottom = newTop + newRange;

    // Clamp
    if (newTop < totalMinDepth) {
      newTop = totalMinDepth;
      newBottom = newTop + newRange;
    }
    if (newBottom > totalMaxDepth) {
      newBottom = totalMaxDepth;
      newTop = Math.max(totalMinDepth, newBottom - newRange);
    }

    set({ topDepth: newTop, bottomDepth: newBottom, pixelsPerMeter: newPPM });
  },

  zoomIn: () => {
    const { topDepth, bottomDepth } = get();
    const center = (topDepth + bottomDepth) / 2;
    get().zoom(ZOOM_FACTOR, center);
  },

  zoomOut: () => {
    const { topDepth, bottomDepth } = get();
    const center = (topDepth + bottomDepth) / 2;
    get().zoom(1 / ZOOM_FACTOR, center);
  },

  fitToData: (minMD, maxMD, containerHeight) => {
    const padding = (maxMD - minMD) * 0.02;
    const newTop = minMD - padding;
    const newBottom = maxMD + padding;
    const newPPM = Math.max(MIN_PIXELS_PER_METER, containerHeight / (newBottom - newTop));

    set({
      topDepth: newTop,
      bottomDepth: newBottom,
      pixelsPerMeter: newPPM,
      totalMinDepth: minMD - padding,
      totalMaxDepth: maxMD + padding,
    });
  },

  setTotalRange: (minMD, maxMD) => {
    set({ totalMinDepth: minMD, totalMaxDepth: maxMD });
  },

  toggleOrientation: () => {
    set((s) => ({ orientation: s.orientation === 'vertical' ? 'horizontal' : 'vertical' }));
  },

  depthToPixel: (md) => {
    const { topDepth, pixelsPerMeter } = get();
    return (md - topDepth) * pixelsPerMeter;
  },

  pixelToDepth: (px) => {
    const { topDepth, pixelsPerMeter } = get();
    return topDepth + px / pixelsPerMeter;
  },
}));
