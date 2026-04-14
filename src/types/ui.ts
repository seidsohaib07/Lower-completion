import type { EquipmentType } from './completion';

export interface DepthViewport {
  topDepth: number;
  bottomDepth: number;
  pixelsPerMeter: number;
  orientation: 'vertical' | 'horizontal';
}

export interface SelectionState {
  type: 'none' | 'depth_interval' | 'equipment';
  topMD?: number;
  bottomMD?: number;
  equipmentId?: string;
}

export interface DragState {
  isDragging: boolean;
  startDepth?: number;
  currentDepth?: number;
}

export type ActiveTool = 'select' | `place_${EquipmentType}`;

export function toolToEquipmentType(tool: ActiveTool): EquipmentType | null {
  if (tool === 'select') return null;
  return tool.replace(/^place_/, '') as EquipmentType;
}

export function equipmentTypeToTool(type: EquipmentType): ActiveTool {
  return `place_${type}` as ActiveTool;
}

export type Theme = 'light' | 'dark';
