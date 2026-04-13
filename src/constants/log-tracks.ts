import type { TrackConfig } from '../types';

// Auto-detection mapping: Excel column names -> standard curve names
export const COLUMN_NAME_MAP: Record<string, string> = {
  'md': 'MD',
  'measured_depth': 'MD',
  'measured depth': 'MD',
  'depth': 'MD',
  'tvd': 'TVD',
  'true_vertical_depth': 'TVD',
  'true vertical depth': 'TVD',
  'phie': 'PHIE',
  'porosity': 'PHIE',
  'effective_porosity': 'PHIE',
  'por': 'PHIE',
  'perm': 'PERM',
  'permeability': 'PERM',
  'k': 'PERM',
  'kh': 'PERM',
  'sw': 'SW',
  'water_saturation': 'SW',
  'water saturation': 'SW',
  'swat': 'SW',
  'net_pay': 'NETPAY',
  'net pay': 'NETPAY',
  'netpay': 'NETPAY',
  'nettopay': 'NETPAY',
  'pay': 'NETPAY',
  'gr': 'GR',
  'gamma_ray': 'GR',
  'gamma ray': 'GR',
  'gamma': 'GR',
  'rt': 'RT',
  'resistivity': 'RT',
  'res': 'RT',
  'ild': 'RT',
  'rhob': 'RHOB',
  'density': 'RHOB',
  'bulk_density': 'RHOB',
  'nphi': 'NPHI',
  'neutron': 'NPHI',
  'neutron_porosity': 'NPHI',
  'vcl': 'VCL',
  'clay_volume': 'VCL',
  'vshale': 'VCL',
  'vsh': 'VCL',
};

// Curve metadata with display properties
export interface CurveDefaults {
  scaleMin: number;
  scaleMax: number;
  scaleType: 'linear' | 'logarithmic';
  color: string;
  fillColor?: string;
  fillLeft?: boolean;
  fillRight?: boolean;
  unit: string;
  description: string;
  gridLines: number;
}

export const CURVE_DEFAULTS: Record<string, CurveDefaults> = {
  GR: {
    scaleMin: 0,
    scaleMax: 150,
    scaleType: 'linear',
    color: '#15803d',
    fillColor: 'rgba(21, 128, 61, 0.3)',
    fillLeft: true,
    unit: 'API',
    description: 'Gamma Ray',
    gridLines: 5,
  },
  PHIE: {
    scaleMin: 0,
    scaleMax: 0.4,
    scaleType: 'linear',
    color: '#16a34a',
    fillColor: 'rgba(22, 163, 74, 0.3)',
    fillLeft: true,
    unit: 'v/v',
    description: 'Effective Porosity',
    gridLines: 4,
  },
  PERM: {
    scaleMin: 0.1,
    scaleMax: 10000,
    scaleType: 'logarithmic',
    color: '#dc2626',
    unit: 'mD',
    description: 'Permeability',
    gridLines: 4,
  },
  SW: {
    scaleMin: 0,
    scaleMax: 1,
    scaleType: 'linear',
    color: '#2563eb',
    fillColor: 'rgba(37, 99, 235, 0.3)',
    fillRight: true,
    unit: 'frac',
    description: 'Water Saturation',
    gridLines: 5,
  },
  NETPAY: {
    scaleMin: 0,
    scaleMax: 1,
    scaleType: 'linear',
    color: '#ca8a04',
    fillColor: 'rgba(202, 138, 4, 0.3)',
    fillLeft: true,
    unit: 'flag',
    description: 'Net Pay',
    gridLines: 2,
  },
  RT: {
    scaleMin: 0.2,
    scaleMax: 2000,
    scaleType: 'logarithmic',
    color: '#171717',
    unit: 'ohm.m',
    description: 'Resistivity',
    gridLines: 4,
  },
  RHOB: {
    scaleMin: 1.95,
    scaleMax: 2.95,
    scaleType: 'linear',
    color: '#dc2626',
    unit: 'g/cc',
    description: 'Bulk Density',
    gridLines: 4,
  },
  NPHI: {
    scaleMin: 0.45,
    scaleMax: -0.15,
    scaleType: 'linear',
    color: '#2563eb',
    unit: 'v/v',
    description: 'Neutron Porosity',
    gridLines: 4,
  },
  VCL: {
    scaleMin: 0,
    scaleMax: 1,
    scaleType: 'linear',
    color: '#92400e',
    fillColor: 'rgba(146, 64, 14, 0.3)',
    fillLeft: true,
    unit: 'frac',
    description: 'Clay Volume',
    gridLines: 5,
  },
};

export const DEFAULT_TRACK_WIDTH = 150;
export const DEPTH_TRACK_WIDTH = 70;
export const DEFAULT_NULL_VALUE = -999.25;

export function createDefaultTrackConfig(curveName: string, id: string): TrackConfig {
  const defaults = CURVE_DEFAULTS[curveName];
  if (!defaults) {
    return {
      id,
      curveNames: [curveName],
      scaleMin: 0,
      scaleMax: 1,
      scaleType: 'linear',
      width: DEFAULT_TRACK_WIDTH,
      color: '#94a3b8',
      gridLines: 5,
      visible: true,
    };
  }
  return {
    id,
    curveNames: [curveName],
    scaleMin: defaults.scaleMin,
    scaleMax: defaults.scaleMax,
    scaleType: defaults.scaleType,
    width: DEFAULT_TRACK_WIDTH,
    color: defaults.color,
    fillLeft: defaults.fillLeft,
    fillRight: defaults.fillRight,
    fillColor: defaults.fillColor,
    gridLines: defaults.gridLines,
    visible: true,
  };
}
