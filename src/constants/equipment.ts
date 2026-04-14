import type { EquipmentType } from '../types';

export const DEFAULT_JOINT_LENGTH = 12.2; // meters (typical 40-ft joint)

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

export const DEFAULT_ICD_SCREEN = {
  od: 4.5,
  innerDiameter: 3.813,
  meshSize: 200,
  screenType: 'premium_mesh' as const,
  gaugeOD: 4.75,
  nozzleCount: 4,
  nozzleSize: 3.0,
  flowArea: 28.3,
} as const;

export const DEFAULT_AICD_SCREEN = {
  od: 4.5,
  innerDiameter: 3.813,
  meshSize: 200,
  screenType: 'premium_mesh' as const,
  gaugeOD: 4.75,
  nozzleCount: 4,
  nozzleSize: 3.5,
  autonomousRating: 50,
} as const;

export const DEFAULT_SLIDING_SLEEVE = {
  od: 4.5,
  innerDiameter: 3.5,
  sleeveType: 'hydraulic' as const,
  nozzleCount: 8,
  nozzleSize: 3.0,
  position: 'open' as const,
} as const;

export const DEFAULT_PERFORATION = {
  od: 4.5,
  innerDiameter: 3.826,
  shotDensity: 6,
  phasing: 60,
  chargeSize: 22.7,
  penetration: 30,
} as const;

export const DEFAULT_FRAC_SLEEVE = {
  od: 4.5,
  innerDiameter: 3.5,
  ballSize: 2.875,
  portArea: 4.5,
} as const;

export const DEFAULT_CENTRALIZER = {
  od: 4.5,
  innerDiameter: 4.5,
  centralizerType: 'bow_spring' as const,
  maxOD: 5.75,
} as const;

export const DEFAULT_PRODUCTION_PACKER = {
  od: 4.5,
  innerDiameter: 3.875,
  packerType: 'hydraulic_set' as const,
  maxOD: 5.9,
  setPressure: 3500,
} as const;

export const DEFAULT_LINER_HANGER = {
  od: 4.5,
  innerDiameter: 3.826,
  hangerType: 'hydraulic' as const,
  maxOD: 6.75,
} as const;

export const DEFAULT_FLOAT_SHOE = {
  od: 4.5,
  innerDiameter: 3.5,
  shoeType: 'float' as const,
} as const;

export const DEFAULT_FLOAT_COLLAR = {
  od: 4.5,
  innerDiameter: 3.5,
  valveType: 'double' as const,
} as const;

export const DEFAULT_WASH_PIPE = {
  od: 2.875,
  innerDiameter: 2.441,
  washOD: 2.875,
} as const;

/**
 * Standard physical length per equipment type (meters).
 * When placing equipment, the length is snapped to integer multiples of this value.
 * A value of null means length is variable (user-defined).
 */
export const STANDARD_LENGTH: Record<EquipmentType, number | null> = {
  blank_pipe: null,            // variable (made of 12.2m joints but length flexible)
  swell_packer: 3.0,           // typical 3m rubber element on a pup joint
  sand_screen: 12.0,           // one screen joint ~12 m
  icd_screen: 12.0,            // one screen joint with ICD nozzles
  aicd_screen: 12.0,           // one AICD screen joint
  sliding_sleeve: 2.0,         // ~2 m sleeve
  perforation: null,           // variable length perforated interval
  frac_sleeve: 1.5,            // ~1.5 m ball-activated frac port
  centralizer: 0.4,            // ~0.4 m bow-spring centralizer
  production_packer: 3.0,      // ~3 m permanent packer
  liner_hanger: 1.5,
  float_shoe: 0.5,
  float_collar: 0.6,
  wash_pipe: null,             // runs full screen length
};

export const EQUIPMENT_COLORS: Record<EquipmentType, string> = {
  blank_pipe: '#64748b',
  swell_packer: '#dc2626',
  sand_screen: '#2563eb',
  icd_screen: '#0891b2',
  aicd_screen: '#0e7490',
  sliding_sleeve: '#16a34a',
  perforation: '#f59e0b',
  frac_sleeve: '#9333ea',
  centralizer: '#475569',
  production_packer: '#991b1b',
  liner_hanger: '#1e40af',
  float_shoe: '#374151',
  float_collar: '#4b5563',
  wash_pipe: '#06b6d4',
};

export const EQUIPMENT_LABELS: Record<EquipmentType, string> = {
  blank_pipe: 'Blank Pipe',
  swell_packer: 'Swell Packer',
  sand_screen: 'Sand Screen',
  icd_screen: 'ICD Screen',
  aicd_screen: 'AICD Screen',
  sliding_sleeve: 'Sliding Sleeve',
  perforation: 'Perforation',
  frac_sleeve: 'Frac Sleeve',
  centralizer: 'Centralizer',
  production_packer: 'Production Packer',
  liner_hanger: 'Liner Hanger',
  float_shoe: 'Float Shoe',
  float_collar: 'Float Collar',
  wash_pipe: 'Wash Pipe',
};

export const EQUIPMENT_SHORT_LABEL: Record<EquipmentType, string> = {
  blank_pipe: 'BP',
  swell_packer: 'SP',
  sand_screen: 'SS',
  icd_screen: 'ICD',
  aicd_screen: 'AICD',
  sliding_sleeve: 'SLV',
  perforation: 'PRF',
  frac_sleeve: 'FRS',
  centralizer: 'CTR',
  production_packer: 'PP',
  liner_hanger: 'LH',
  float_shoe: 'FSH',
  float_collar: 'FCL',
  wash_pipe: 'WP',
};

/**
 * Snap a requested length to the nearest integer multiple of the standard length.
 * Returns the snapped length. If the type has no standard length, returns the input.
 * Ensures at least one unit.
 */
export function snapLengthToStandard(type: EquipmentType, requestedLength: number): number {
  const std = STANDARD_LENGTH[type];
  if (std === null || std === undefined) return Math.max(0.1, requestedLength);
  const units = Math.max(1, Math.round(requestedLength / std));
  return units * std;
}
