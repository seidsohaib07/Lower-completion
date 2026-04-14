import type { EquipmentType } from './completion';

export interface TallyRow {
  sequence: number;
  equipmentType: EquipmentType;
  description: string;
  topMD: number;
  bottomMD: number;
  length: number;
  cumulativeLength: number;
  od: number;
  innerDiameter: number;
  comment?: string;
  equipmentId: string;
}

export interface CompletionTally {
  wellName: string;
  date: string;
  preparedBy: string;
  rows: TallyRow[];
  totalLength: number;
}
