import type { EquipmentType } from '../types';

export const DEFAULT_JOINT_LENGTH = 12.2; // meters

// 4-1/2" pipe in 6" OH (Gullfaks default)
export const DEFAULT_BLANK_PIPE = {
  od: 4.5,
  innerDiameter: 3.826,
  jointLength: DEFAULT_JOINT_LENGTH,
  grade: 'L-80',
  weight: 16.6, // kg/m
  connectionType: 'VAM TOP',
} as const;

export const DEFAULT_OPEN_HOLE_DIAMETER = 6.0; // inches

export const DEFAULT_SWELL_PACKER = {
  od: 4.5,
  innerDiameter: 3.5,
  length: 1.0, // meters
  swellMedium: 'water' as const,
  swellTime: 48,
  maxOD: 5.875, // swelled towards 6" OH
  bodyOD: 4.5,
} as const;

export const DEFAULT_SAND_SCREEN = {
  od: 4.5,
  innerDiameter: 3.813,
  meshSize: 200, // microns
  screenType: 'premium_mesh' as const,
  gaugeOD: 4.75,
} as const;

export const DEFAULT_SLIDING_SLEEVE = {
  od: 4.5,
  innerDiameter: 3.5,
  sleeveType: 'ICD' as const,
  nozzleCount: 8,
  nozzleSize: 3.0, // mm
  flowArea: 56.5, // mm^2
  position: 'open' as const,
} as const;

export const EQUIPMENT_COLORS: Record<EquipmentType, string> = {
  blank_pipe: '#64748b',
  swell_packer: '#dc2626',
  sand_screen: '#2563eb',
  sliding_sleeve: '#16a34a',
};

export const EQUIPMENT_LABELS: Record<EquipmentType, string> = {
  blank_pipe: 'Blank Pipe',
  swell_packer: 'Swell Packer',
  sand_screen: 'Sand Screen',
  sliding_sleeve: 'Sliding Sleeve',
};
