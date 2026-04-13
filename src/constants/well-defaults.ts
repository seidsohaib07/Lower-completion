import type { WellMetadata } from '../types';

export const DEFAULT_WELL: WellMetadata = {
  name: 'New Well',
  field: 'Gullfaks',
  platform: 'Gullfaks A',
  wellType: 'producer',
  datum: 'RKB',
  datumElevation: 28.0,        // meters above MSL
  openHoleDiameter: 6.0,       // inches
  openHoleTopMD: 2500,         // meters
  openHoleBaseMD: 3000,        // meters
};

// Viewport defaults
export const DEFAULT_PIXELS_PER_METER = 4;
export const MIN_PIXELS_PER_METER = 0.5;
export const MAX_PIXELS_PER_METER = 50;
export const SCROLL_SENSITIVITY = 1.0;
export const ZOOM_FACTOR = 1.15;
