export type EquipmentType =
  | 'blank_pipe'
  | 'swell_packer'
  | 'sand_screen'
  | 'sliding_sleeve';

export interface EquipmentBase {
  id: string;
  type: EquipmentType;
  topMD: number;
  bottomMD: number;
  length: number;
  od: number;           // inches
  innerDiameter: number; // inches
  grade?: string;
  weight?: number;       // kg/m
  connectionType?: string;
  comment?: string;
}

export interface BlankPipe extends EquipmentBase {
  type: 'blank_pipe';
  jointLength: number;   // meters (default 12.2m)
}

export interface SwellPacker extends EquipmentBase {
  type: 'swell_packer';
  swellMedium: 'oil' | 'water' | 'dual';
  swellTime: number;     // hours to full swell
  maxOD: number;         // swelled OD (inches)
  bodyOD: number;        // unswelled body OD (inches)
}

export interface SandScreen extends EquipmentBase {
  type: 'sand_screen';
  meshSize: number;      // microns
  screenType: 'wire_wrapped' | 'premium_mesh' | 'sintered';
  gaugeOD: number;       // gauge ring OD (inches)
}

export interface SlidingSleeve extends EquipmentBase {
  type: 'sliding_sleeve';
  sleeveType: 'ICD' | 'AICD' | 'manual';
  nozzleCount?: number;
  nozzleSize?: number;    // mm
  flowArea?: number;      // mm^2
  autonomousRating?: number; // bar (for AICD)
  position: 'open' | 'closed';
}

export type CompletionEquipment =
  | BlankPipe
  | SwellPacker
  | SandScreen
  | SlidingSleeve;

export interface CompletionString {
  wellName: string;
  items: CompletionEquipment[];
  hangerMD: number;
  tdMD: number;
}
