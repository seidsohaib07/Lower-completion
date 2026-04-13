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

export type ActiveTool =
  | 'select'
  | 'place_blank_pipe'
  | 'place_swell_packer'
  | 'place_sand_screen'
  | 'place_sliding_sleeve';

export function toolToEquipmentType(tool: ActiveTool): EquipmentType | null {
  const map: Record<string, EquipmentType> = {
    place_blank_pipe: 'blank_pipe',
    place_swell_packer: 'swell_packer',
    place_sand_screen: 'sand_screen',
    place_sliding_sleeve: 'sliding_sleeve',
  };
  return map[tool] ?? null;
}
