export type EquipmentType =
  | 'blank_pipe'
  | 'swell_packer'
  | 'sand_screen'
  | 'icd_screen'
  | 'aicd_screen'
  | 'sliding_sleeve'
  | 'perforation'
  | 'frac_sleeve'
  | 'centralizer'
  | 'production_packer'
  | 'liner_hanger'
  | 'float_shoe'
  | 'float_collar'
  | 'wash_pipe';

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

export interface ICDScreen extends EquipmentBase {
  type: 'icd_screen';
  meshSize: number;
  screenType: 'wire_wrapped' | 'premium_mesh' | 'sintered';
  gaugeOD: number;
  nozzleCount: number;
  nozzleSize: number; // mm
  flowArea: number;   // mm^2
}

export interface AICDScreen extends EquipmentBase {
  type: 'aicd_screen';
  meshSize: number;
  screenType: 'wire_wrapped' | 'premium_mesh' | 'sintered';
  gaugeOD: number;
  nozzleCount: number;
  nozzleSize: number;
  autonomousRating: number; // bar
}

export interface SlidingSleeve extends EquipmentBase {
  type: 'sliding_sleeve';
  sleeveType: 'manual' | 'hydraulic';
  nozzleCount?: number;
  nozzleSize?: number;
  position: 'open' | 'closed';
}

export interface Perforation extends EquipmentBase {
  type: 'perforation';
  shotDensity: number;   // SPF (shots per foot)
  phasing: number;       // degrees (e.g., 60)
  chargeSize: number;    // grams
  penetration?: number;  // inches into formation
}

export interface FracSleeve extends EquipmentBase {
  type: 'frac_sleeve';
  ballSize: number;      // inches
  portArea: number;      // in^2
  stage?: number;
}

export interface Centralizer extends EquipmentBase {
  type: 'centralizer';
  centralizerType: 'rigid' | 'bow_spring' | 'semi_rigid';
  maxOD: number; // inches (standoff OD)
}

export interface ProductionPacker extends EquipmentBase {
  type: 'production_packer';
  packerType: 'permanent' | 'retrievable' | 'hydraulic_set';
  maxOD: number;
  setPressure?: number; // psi
}

export interface LinerHanger extends EquipmentBase {
  type: 'liner_hanger';
  hangerType: 'mechanical' | 'hydraulic' | 'expandable';
  maxOD: number;
}

export interface FloatShoe extends EquipmentBase {
  type: 'float_shoe';
  shoeType: 'guide' | 'float' | 'eccentric';
}

export interface FloatCollar extends EquipmentBase {
  type: 'float_collar';
  valveType: 'single' | 'double' | 'auto_fill';
}

export interface WashPipe extends EquipmentBase {
  type: 'wash_pipe';
  washOD: number; // inches, runs inside screen
}

export type CompletionEquipment =
  | BlankPipe
  | SwellPacker
  | SandScreen
  | ICDScreen
  | AICDScreen
  | SlidingSleeve
  | Perforation
  | FracSleeve
  | Centralizer
  | ProductionPacker
  | LinerHanger
  | FloatShoe
  | FloatCollar
  | WashPipe;

export interface CompletionString {
  wellName: string;
  items: CompletionEquipment[];
  hangerMD: number;
  tdMD: number;
}
