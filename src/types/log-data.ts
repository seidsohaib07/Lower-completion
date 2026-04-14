export interface LogCurve {
  name: string;
  unit: string;
  description: string;
  data: number[];
  nullValue: number;
}

export interface LogDataSet {
  wellName: string;
  depthCurve: number[];
  depthUnit: 'm' | 'ft';
  curves: LogCurve[];
  depthStep: number;
  minDepth: number;
  maxDepth: number;
}

export interface TrackConfig {
  id: string;
  curveNames: string[];
  scaleMin: number;
  scaleMax: number;
  scaleType: 'linear' | 'logarithmic';
  width: number;
  color: string;
  fillLeft?: boolean;
  fillRight?: boolean;
  fillColor?: string;
  gridLines: number;
  visible: boolean;
}
