import type { LogDataSet, LogCurve } from '../types';
import { DEFAULT_NULL_VALUE } from '../constants';

/**
 * Generate realistic synthetic CPI log data for a Gullfaks-style well.
 * Depth range: 2500m - 3000m (open hole section).
 */
export function generateDemoLogData(): LogDataSet {
  const minDepth = 2500;
  const maxDepth = 3000;
  const step = 0.1524; // ~0.5ft sampling
  const depthCurve: number[] = [];

  for (let d = minDepth; d <= maxDepth; d += step) {
    depthCurve.push(Math.round(d * 10000) / 10000);
  }

  // Define reservoir zones (good reservoir, shale, etc.)
  const zones = defineZones(minDepth, maxDepth);

  const curves: LogCurve[] = [
    {
      name: 'GR',
      unit: 'API',
      description: 'Gamma Ray',
      data: generateGR(depthCurve, zones),
      nullValue: DEFAULT_NULL_VALUE,
    },
    {
      name: 'PHIE',
      unit: 'v/v',
      description: 'Effective Porosity',
      data: generatePHIE(depthCurve, zones),
      nullValue: DEFAULT_NULL_VALUE,
    },
    {
      name: 'PERM',
      unit: 'mD',
      description: 'Permeability',
      data: generatePERM(depthCurve, zones),
      nullValue: DEFAULT_NULL_VALUE,
    },
    {
      name: 'SW',
      unit: 'frac',
      description: 'Water Saturation',
      data: generateSW(depthCurve, zones),
      nullValue: DEFAULT_NULL_VALUE,
    },
    {
      name: 'RHOB',
      unit: 'g/cc',
      description: 'Bulk Density',
      data: generateRHOB(depthCurve, zones),
      nullValue: DEFAULT_NULL_VALUE,
    },
    {
      name: 'NPHI',
      unit: 'v/v',
      description: 'Neutron Porosity',
      data: generateNPHI(depthCurve, zones),
      nullValue: DEFAULT_NULL_VALUE,
    },
    {
      name: 'VCL',
      unit: 'frac',
      description: 'Clay Volume',
      data: generateVCL(depthCurve, zones),
      nullValue: DEFAULT_NULL_VALUE,
    },
  ];

  return {
    wellName: 'Gullfaks A-42',
    depthCurve,
    depthUnit: 'm',
    curves,
    depthStep: step,
    minDepth,
    maxDepth,
  };
}

interface Zone {
  topMD: number;
  bottomMD: number;
  type: 'reservoir' | 'shale' | 'transition' | 'tight';
  quality: number; // 0-1, how good the reservoir is
}

function defineZones(_minDepth: number, _maxDepth: number): Zone[] {
  return [
    { topMD: 2500, bottomMD: 2530, type: 'shale', quality: 0 },
    { topMD: 2530, bottomMD: 2590, type: 'reservoir', quality: 0.8 },
    { topMD: 2590, bottomMD: 2610, type: 'transition', quality: 0.3 },
    { topMD: 2610, bottomMD: 2650, type: 'shale', quality: 0 },
    { topMD: 2650, bottomMD: 2740, type: 'reservoir', quality: 0.9 },
    { topMD: 2740, bottomMD: 2760, type: 'tight', quality: 0.1 },
    { topMD: 2760, bottomMD: 2830, type: 'reservoir', quality: 0.7 },
    { topMD: 2830, bottomMD: 2860, type: 'shale', quality: 0 },
    { topMD: 2860, bottomMD: 2950, type: 'reservoir', quality: 0.85 },
    { topMD: 2950, bottomMD: 3000, type: 'transition', quality: 0.2 },
  ];
}

function getZoneAtDepth(depth: number, zones: Zone[]): Zone {
  for (const z of zones) {
    if (depth >= z.topMD && depth < z.bottomMD) return z;
  }
  return zones[zones.length - 1];
}

function noise(amplitude: number): number {
  return (Math.random() - 0.5) * 2 * amplitude;
}

function smoothNoise(i: number, arr: number[], windowSize: number = 3): number {
  let sum = 0;
  let count = 0;
  for (let j = Math.max(0, i - windowSize); j <= Math.min(arr.length - 1, i + windowSize); j++) {
    sum += arr[j];
    count++;
  }
  return sum / count;
}

function generateGR(depths: number[], zones: Zone[]): number[] {
  const raw = depths.map((d) => {
    const z = getZoneAtDepth(d, zones);
    const base = z.type === 'shale' ? 110 : z.type === 'reservoir' ? 25 + (1 - z.quality) * 30 : z.type === 'tight' ? 60 : 70;
    return Math.max(5, base + noise(15));
  });
  return raw.map((_, i) => smoothNoise(i, raw, 2));
}

function generatePHIE(depths: number[], zones: Zone[]): number[] {
  const raw = depths.map((d) => {
    const z = getZoneAtDepth(d, zones);
    const base = z.type === 'reservoir' ? 0.15 + z.quality * 0.12 : z.type === 'shale' ? 0.02 : z.type === 'tight' ? 0.05 : 0.08;
    return Math.max(0, Math.min(0.4, base + noise(0.03)));
  });
  return raw.map((_, i) => smoothNoise(i, raw, 3));
}

function generatePERM(depths: number[], zones: Zone[]): number[] {
  const raw = depths.map((d) => {
    const z = getZoneAtDepth(d, zones);
    const base = z.type === 'reservoir' ? 100 * Math.pow(10, z.quality * 2) : z.type === 'shale' ? 0.5 : z.type === 'tight' ? 5 : 10;
    return Math.max(0.1, base * (1 + noise(0.4)));
  });
  return raw.map((_, i) => smoothNoise(i, raw, 2));
}

function generateSW(depths: number[], zones: Zone[]): number[] {
  const raw = depths.map((d) => {
    const z = getZoneAtDepth(d, zones);
    const base = z.type === 'reservoir' ? 0.15 + (1 - z.quality) * 0.3 : z.type === 'shale' ? 0.9 : z.type === 'tight' ? 0.7 : 0.5;
    return Math.max(0, Math.min(1, base + noise(0.05)));
  });
  return raw.map((_, i) => smoothNoise(i, raw, 3));
}

function generateRHOB(depths: number[], zones: Zone[]): number[] {
  const raw = depths.map((d) => {
    const z = getZoneAtDepth(d, zones);
    const base = z.type === 'reservoir' ? 2.2 + (1 - z.quality) * 0.2 : z.type === 'shale' ? 2.55 : z.type === 'tight' ? 2.5 : 2.4;
    return Math.max(1.95, Math.min(2.95, base + noise(0.03)));
  });
  return raw.map((_, i) => smoothNoise(i, raw, 2));
}

function generateNPHI(depths: number[], zones: Zone[]): number[] {
  const raw = depths.map((d) => {
    const z = getZoneAtDepth(d, zones);
    const base = z.type === 'reservoir' ? 0.18 + z.quality * 0.08 : z.type === 'shale' ? 0.35 : z.type === 'tight' ? 0.12 : 0.2;
    return Math.max(-0.05, Math.min(0.45, base + noise(0.02)));
  });
  return raw.map((_, i) => smoothNoise(i, raw, 2));
}

function generateVCL(depths: number[], zones: Zone[]): number[] {
  const raw = depths.map((d) => {
    const z = getZoneAtDepth(d, zones);
    const base = z.type === 'shale' ? 0.8 : z.type === 'reservoir' ? 0.05 + (1 - z.quality) * 0.15 : z.type === 'tight' ? 0.3 : 0.4;
    return Math.max(0, Math.min(1, base + noise(0.05)));
  });
  return raw.map((_, i) => smoothNoise(i, raw, 3));
}
