import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type {
  CompletionString,
  CompletionEquipment,
  BlankPipe,
  SwellPacker,
  SandScreen,
  SlidingSleeve,
  EquipmentType,
} from '../types';
import { DEFAULT_BLANK_PIPE, DEFAULT_SWELL_PACKER, DEFAULT_SAND_SCREEN, DEFAULT_SLIDING_SLEEVE } from '../constants';

interface CompletionState {
  completionString: CompletionString;

  initializeBlankPipe: (topMD: number, bottomMD: number, jointLength?: number) => void;
  replaceInterval: (topMD: number, bottomMD: number, equipmentType: EquipmentType) => void;
  removeEquipment: (id: string) => void;
  updateEquipment: (id: string, updates: Partial<CompletionEquipment>) => void;
  getItemAtDepth: (md: number) => CompletionEquipment | undefined;
  setCompletionString: (cs: CompletionString) => void;
}

function createBlankPipe(topMD: number, bottomMD: number, jointLength?: number): BlankPipe {
  return {
    id: uuidv4(),
    type: 'blank_pipe',
    topMD,
    bottomMD,
    length: bottomMD - topMD,
    od: DEFAULT_BLANK_PIPE.od,
    innerDiameter: DEFAULT_BLANK_PIPE.innerDiameter,
    jointLength: jointLength ?? DEFAULT_BLANK_PIPE.jointLength,
    grade: DEFAULT_BLANK_PIPE.grade,
    weight: DEFAULT_BLANK_PIPE.weight,
    connectionType: DEFAULT_BLANK_PIPE.connectionType,
  };
}

function createEquipment(type: EquipmentType, topMD: number, bottomMD: number): CompletionEquipment {
  const base = {
    id: uuidv4(),
    topMD,
    bottomMD,
    length: bottomMD - topMD,
  };

  switch (type) {
    case 'swell_packer': {
      const length = Math.max(bottomMD - topMD, DEFAULT_SWELL_PACKER.length);
      return {
        ...base,
        type: 'swell_packer',
        bottomMD: topMD + length,
        length,
        od: DEFAULT_SWELL_PACKER.od,
        innerDiameter: DEFAULT_SWELL_PACKER.innerDiameter,
        swellMedium: DEFAULT_SWELL_PACKER.swellMedium,
        swellTime: DEFAULT_SWELL_PACKER.swellTime,
        maxOD: DEFAULT_SWELL_PACKER.maxOD,
        bodyOD: DEFAULT_SWELL_PACKER.bodyOD,
      } as SwellPacker;
    }
    case 'sand_screen':
      return {
        ...base,
        type: 'sand_screen',
        od: DEFAULT_SAND_SCREEN.od,
        innerDiameter: DEFAULT_SAND_SCREEN.innerDiameter,
        meshSize: DEFAULT_SAND_SCREEN.meshSize,
        screenType: DEFAULT_SAND_SCREEN.screenType,
        gaugeOD: DEFAULT_SAND_SCREEN.gaugeOD,
      } as SandScreen;
    case 'sliding_sleeve':
      return {
        ...base,
        type: 'sliding_sleeve',
        od: DEFAULT_SLIDING_SLEEVE.od,
        innerDiameter: DEFAULT_SLIDING_SLEEVE.innerDiameter,
        sleeveType: DEFAULT_SLIDING_SLEEVE.sleeveType,
        nozzleCount: DEFAULT_SLIDING_SLEEVE.nozzleCount,
        nozzleSize: DEFAULT_SLIDING_SLEEVE.nozzleSize,
        flowArea: DEFAULT_SLIDING_SLEEVE.flowArea,
        position: DEFAULT_SLIDING_SLEEVE.position,
      } as SlidingSleeve;
    default:
      return createBlankPipe(topMD, bottomMD);
  }
}

export const useCompletionStore = create<CompletionState>((set, get) => ({
  completionString: {
    wellName: 'New Well',
    items: [],
    hangerMD: 2500,
    tdMD: 3000,
  },

  initializeBlankPipe: (topMD, bottomMD, jointLength) => {
    const pipe = createBlankPipe(topMD, bottomMD, jointLength);
    set({
      completionString: {
        ...get().completionString,
        items: [pipe],
        hangerMD: topMD,
        tdMD: bottomMD,
      },
    });
  },

  replaceInterval: (topMD, bottomMD, equipmentType) => {
    const { completionString } = get();
    const newItems: CompletionEquipment[] = [];

    for (const item of completionString.items) {
      // Item is entirely before the replacement interval
      if (item.bottomMD <= topMD) {
        newItems.push(item);
        continue;
      }
      // Item is entirely after the replacement interval
      if (item.topMD >= bottomMD) {
        newItems.push(item);
        continue;
      }

      // Item overlaps with the replacement interval - split it
      // Keep portion above the replacement
      if (item.topMD < topMD) {
        if (item.type === 'blank_pipe') {
          newItems.push(createBlankPipe(item.topMD, topMD, (item as BlankPipe).jointLength));
        } else {
          // Non-blank equipment: keep as is but truncate
          newItems.push({ ...item, id: uuidv4(), bottomMD: topMD, length: topMD - item.topMD });
        }
      }

      // Keep portion below the replacement
      if (item.bottomMD > bottomMD) {
        if (item.type === 'blank_pipe') {
          newItems.push(createBlankPipe(bottomMD, item.bottomMD, (item as BlankPipe).jointLength));
        } else {
          newItems.push({ ...item, id: uuidv4(), topMD: bottomMD, length: item.bottomMD - bottomMD });
        }
      }
    }

    // Insert the new equipment
    const newEquipment = createEquipment(equipmentType, topMD, bottomMD);
    newItems.push(newEquipment);

    // Sort by topMD
    newItems.sort((a, b) => a.topMD - b.topMD);

    set({
      completionString: {
        ...completionString,
        items: newItems,
      },
    });
  },

  removeEquipment: (id) => {
    const { completionString } = get();
    const item = completionString.items.find((i) => i.id === id);
    if (!item || item.type === 'blank_pipe') return;

    // Replace with blank pipe
    const newItems = completionString.items.filter((i) => i.id !== id);
    newItems.push(createBlankPipe(item.topMD, item.bottomMD));

    // Merge adjacent blank pipes
    newItems.sort((a, b) => a.topMD - b.topMD);
    const merged: CompletionEquipment[] = [];
    for (const curr of newItems) {
      const prev = merged[merged.length - 1];
      if (prev && prev.type === 'blank_pipe' && curr.type === 'blank_pipe' && Math.abs(prev.bottomMD - curr.topMD) < 0.01) {
        // Merge
        merged[merged.length - 1] = createBlankPipe(prev.topMD, curr.bottomMD, (prev as BlankPipe).jointLength);
      } else {
        merged.push(curr);
      }
    }

    set({
      completionString: {
        ...completionString,
        items: merged,
      },
    });
  },

  updateEquipment: (id, updates) => {
    const { completionString } = get();
    const newItems = completionString.items.map((item): CompletionEquipment => {
      if (item.id !== id) return item;
      const updated = Object.assign({}, item, updates) as CompletionEquipment;
      // Recalculate length if depths changed
      if (updates.topMD !== undefined || updates.bottomMD !== undefined) {
        updated.length = updated.bottomMD - updated.topMD;
      }
      return updated;
    });
    set({ completionString: { ...completionString, items: newItems } });
  },

  getItemAtDepth: (md) => {
    return get().completionString.items.find((item) => md >= item.topMD && md <= item.bottomMD);
  },

  setCompletionString: (cs) => {
    set({ completionString: cs });
  },
}));
