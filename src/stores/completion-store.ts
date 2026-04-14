import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type {
  CompletionString,
  CompletionEquipment,
  BlankPipe,
  EquipmentType,
} from '../types';
import {
  DEFAULT_BLANK_PIPE,
  DEFAULT_SWELL_PACKER,
  DEFAULT_SAND_SCREEN,
  DEFAULT_ICD_SCREEN,
  DEFAULT_AICD_SCREEN,
  DEFAULT_SLIDING_SLEEVE,
  DEFAULT_PERFORATION,
  DEFAULT_FRAC_SLEEVE,
  DEFAULT_CENTRALIZER,
  DEFAULT_PRODUCTION_PACKER,
  DEFAULT_LINER_HANGER,
  DEFAULT_FLOAT_SHOE,
  DEFAULT_FLOAT_COLLAR,
  DEFAULT_WASH_PIPE,
  DEFAULT_CASING,
  DEFAULT_TUBING,
  DEFAULT_PUP_JOINT,
  DEFAULT_CONSTRICTOR,
  STANDARD_LENGTH,
  snapLengthToStandard,
} from '../constants';

interface CompletionState {
  completionString: CompletionString;

  initializeBlankPipe: (topMD: number, bottomMD: number, jointLength?: number) => void;
  replaceInterval: (topMD: number, bottomMD: number, equipmentType: EquipmentType) => void;
  placeAtDepth: (centerMD: number, equipmentType: EquipmentType, lengthOverride?: number) => void;
  moveEquipment: (id: string, newTopMD: number) => void;
  removeEquipment: (id: string) => void;
  duplicateEquipment: (id: string) => void;
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
  const id = uuidv4();
  const length = bottomMD - topMD;

  switch (type) {
    case 'casing':
      return {
        id, type, topMD, bottomMD, length,
        od: DEFAULT_CASING.od,
        innerDiameter: DEFAULT_CASING.innerDiameter,
        jointLength: DEFAULT_CASING.jointLength,
        grade: DEFAULT_CASING.grade,
        weight: DEFAULT_CASING.weight,
        connectionType: DEFAULT_CASING.connectionType,
        casingClass: DEFAULT_CASING.casingClass,
      };
    case 'tubing':
      return {
        id, type, topMD, bottomMD, length,
        od: DEFAULT_TUBING.od,
        innerDiameter: DEFAULT_TUBING.innerDiameter,
        jointLength: DEFAULT_TUBING.jointLength,
        grade: DEFAULT_TUBING.grade,
        weight: DEFAULT_TUBING.weight,
        connectionType: DEFAULT_TUBING.connectionType,
      };
    case 'blank_pipe':
      return createBlankPipe(topMD, bottomMD);
    case 'pup_joint':
      return {
        id, type, topMD, bottomMD, length,
        od: DEFAULT_PUP_JOINT.od,
        innerDiameter: DEFAULT_PUP_JOINT.innerDiameter,
        grade: DEFAULT_PUP_JOINT.grade,
        weight: DEFAULT_PUP_JOINT.weight,
        connectionType: DEFAULT_PUP_JOINT.connectionType,
      };
    case 'constrictor':
      return {
        id, type, topMD, bottomMD, length,
        od: DEFAULT_CONSTRICTOR.od,
        innerDiameter: DEFAULT_CONSTRICTOR.innerDiameter,
        constrictionType: DEFAULT_CONSTRICTOR.constrictionType,
        bodyOD: DEFAULT_CONSTRICTOR.bodyOD,
        maxOD: DEFAULT_CONSTRICTOR.maxOD,
      };
    case 'swell_packer':
      return {
        id, type, topMD, bottomMD, length,
        od: DEFAULT_SWELL_PACKER.od,
        innerDiameter: DEFAULT_SWELL_PACKER.innerDiameter,
        swellMedium: DEFAULT_SWELL_PACKER.swellMedium,
        swellTime: DEFAULT_SWELL_PACKER.swellTime,
        maxOD: DEFAULT_SWELL_PACKER.maxOD,
        bodyOD: DEFAULT_SWELL_PACKER.bodyOD,
      };
    case 'sand_screen':
      return {
        id, type, topMD, bottomMD, length,
        od: DEFAULT_SAND_SCREEN.od,
        innerDiameter: DEFAULT_SAND_SCREEN.innerDiameter,
        meshSize: DEFAULT_SAND_SCREEN.meshSize,
        screenType: DEFAULT_SAND_SCREEN.screenType,
        gaugeOD: DEFAULT_SAND_SCREEN.gaugeOD,
      };
    case 'icd_screen':
      return {
        id, type, topMD, bottomMD, length,
        od: DEFAULT_ICD_SCREEN.od,
        innerDiameter: DEFAULT_ICD_SCREEN.innerDiameter,
        meshSize: DEFAULT_ICD_SCREEN.meshSize,
        screenType: DEFAULT_ICD_SCREEN.screenType,
        gaugeOD: DEFAULT_ICD_SCREEN.gaugeOD,
        nozzleCount: DEFAULT_ICD_SCREEN.nozzleCount,
        nozzleSize: DEFAULT_ICD_SCREEN.nozzleSize,
        flowArea: DEFAULT_ICD_SCREEN.flowArea,
      };
    case 'aicd_screen':
      return {
        id, type, topMD, bottomMD, length,
        od: DEFAULT_AICD_SCREEN.od,
        innerDiameter: DEFAULT_AICD_SCREEN.innerDiameter,
        meshSize: DEFAULT_AICD_SCREEN.meshSize,
        screenType: DEFAULT_AICD_SCREEN.screenType,
        gaugeOD: DEFAULT_AICD_SCREEN.gaugeOD,
        nozzleCount: DEFAULT_AICD_SCREEN.nozzleCount,
        nozzleSize: DEFAULT_AICD_SCREEN.nozzleSize,
        autonomousRating: DEFAULT_AICD_SCREEN.autonomousRating,
      };
    case 'sliding_sleeve':
      return {
        id, type, topMD, bottomMD, length,
        od: DEFAULT_SLIDING_SLEEVE.od,
        innerDiameter: DEFAULT_SLIDING_SLEEVE.innerDiameter,
        sleeveType: DEFAULT_SLIDING_SLEEVE.sleeveType,
        nozzleCount: DEFAULT_SLIDING_SLEEVE.nozzleCount,
        nozzleSize: DEFAULT_SLIDING_SLEEVE.nozzleSize,
        position: DEFAULT_SLIDING_SLEEVE.position,
      };
    case 'perforation':
      return {
        id, type, topMD, bottomMD, length,
        od: DEFAULT_PERFORATION.od,
        innerDiameter: DEFAULT_PERFORATION.innerDiameter,
        shotDensity: DEFAULT_PERFORATION.shotDensity,
        phasing: DEFAULT_PERFORATION.phasing,
        chargeSize: DEFAULT_PERFORATION.chargeSize,
        penetration: DEFAULT_PERFORATION.penetration,
      };
    case 'frac_sleeve':
      return {
        id, type, topMD, bottomMD, length,
        od: DEFAULT_FRAC_SLEEVE.od,
        innerDiameter: DEFAULT_FRAC_SLEEVE.innerDiameter,
        ballSize: DEFAULT_FRAC_SLEEVE.ballSize,
        portArea: DEFAULT_FRAC_SLEEVE.portArea,
      };
    case 'centralizer':
      return {
        id, type, topMD, bottomMD, length,
        od: DEFAULT_CENTRALIZER.od,
        innerDiameter: DEFAULT_CENTRALIZER.innerDiameter,
        centralizerType: DEFAULT_CENTRALIZER.centralizerType,
        maxOD: DEFAULT_CENTRALIZER.maxOD,
      };
    case 'production_packer':
      return {
        id, type, topMD, bottomMD, length,
        od: DEFAULT_PRODUCTION_PACKER.od,
        innerDiameter: DEFAULT_PRODUCTION_PACKER.innerDiameter,
        packerType: DEFAULT_PRODUCTION_PACKER.packerType,
        maxOD: DEFAULT_PRODUCTION_PACKER.maxOD,
        setPressure: DEFAULT_PRODUCTION_PACKER.setPressure,
      };
    case 'liner_hanger':
      return {
        id, type, topMD, bottomMD, length,
        od: DEFAULT_LINER_HANGER.od,
        innerDiameter: DEFAULT_LINER_HANGER.innerDiameter,
        hangerType: DEFAULT_LINER_HANGER.hangerType,
        maxOD: DEFAULT_LINER_HANGER.maxOD,
      };
    case 'float_shoe':
      return {
        id, type, topMD, bottomMD, length,
        od: DEFAULT_FLOAT_SHOE.od,
        innerDiameter: DEFAULT_FLOAT_SHOE.innerDiameter,
        shoeType: DEFAULT_FLOAT_SHOE.shoeType,
      };
    case 'float_collar':
      return {
        id, type, topMD, bottomMD, length,
        od: DEFAULT_FLOAT_COLLAR.od,
        innerDiameter: DEFAULT_FLOAT_COLLAR.innerDiameter,
        valveType: DEFAULT_FLOAT_COLLAR.valveType,
      };
    case 'wash_pipe':
      return {
        id, type, topMD, bottomMD, length,
        od: DEFAULT_WASH_PIPE.od,
        innerDiameter: DEFAULT_WASH_PIPE.innerDiameter,
        washOD: DEFAULT_WASH_PIPE.washOD,
      };
  }
}

/**
 * Adjust a placement interval so that it does not overlap any existing non-blank
 * equipment. If the requested window collides with a fixed item, shift the new
 * interval above or below that item (whichever side has more free space).
 */
function shiftIntervalAwayFromObstacles(
  items: CompletionEquipment[],
  requestedTop: number,
  requestedBottom: number
): { topMD: number; bottomMD: number } {
  const length = requestedBottom - requestedTop;
  const obstacles = items.filter((i) => i.type !== 'blank_pipe');
  let top = requestedTop;
  let bottom = requestedBottom;
  // Iterate a few passes to handle sequential overlaps.
  for (let pass = 0; pass < 8; pass++) {
    const hit = obstacles.find((o) => o.bottomMD > top && o.topMD < bottom);
    if (!hit) break;
    const centerReq = (top + bottom) / 2;
    const centerHit = (hit.topMD + hit.bottomMD) / 2;
    if (centerReq <= centerHit) {
      // shift above the obstacle
      bottom = hit.topMD;
      top = bottom - length;
    } else {
      top = hit.bottomMD;
      bottom = top + length;
    }
  }
  return { topMD: top, bottomMD: bottom };
}

// Split overlapping items: keep portions outside [topMD, bottomMD], drop portions inside.
function splitAroundInterval(
  items: CompletionEquipment[],
  topMD: number,
  bottomMD: number
): CompletionEquipment[] {
  const out: CompletionEquipment[] = [];
  for (const item of items) {
    if (item.bottomMD <= topMD || item.topMD >= bottomMD) {
      out.push(item);
      continue;
    }
    // Keep portion above
    if (item.topMD < topMD) {
      if (item.type === 'blank_pipe') {
        out.push(createBlankPipe(item.topMD, topMD, (item as BlankPipe).jointLength));
      } else {
        out.push({ ...item, id: uuidv4(), bottomMD: topMD, length: topMD - item.topMD });
      }
    }
    // Keep portion below
    if (item.bottomMD > bottomMD) {
      if (item.type === 'blank_pipe') {
        out.push(createBlankPipe(bottomMD, item.bottomMD, (item as BlankPipe).jointLength));
      } else {
        out.push({ ...item, id: uuidv4(), topMD: bottomMD, length: item.bottomMD - bottomMD });
      }
    }
  }
  return out;
}

function mergeAdjacentBlankPipes(items: CompletionEquipment[]): CompletionEquipment[] {
  const sorted = [...items].sort((a, b) => a.topMD - b.topMD);
  const merged: CompletionEquipment[] = [];
  for (const curr of sorted) {
    const prev = merged[merged.length - 1];
    if (
      prev &&
      prev.type === 'blank_pipe' &&
      curr.type === 'blank_pipe' &&
      Math.abs(prev.bottomMD - curr.topMD) < 0.01
    ) {
      merged[merged.length - 1] = createBlankPipe(
        prev.topMD,
        curr.bottomMD,
        (prev as BlankPipe).jointLength
      );
    } else {
      merged.push(curr);
    }
  }
  return merged;
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
    // Snap length to standard for fixed-length equipment, anchored at topMD
    const requested = bottomMD - topMD;
    const finalLength = snapLengthToStandard(equipmentType, requested);
    let finalTop = topMD;
    let finalBottom = topMD + finalLength;

    // Shift around any fixed existing equipment instead of replacing.
    const adjusted = shiftIntervalAwayFromObstacles(
      completionString.items,
      finalTop,
      finalBottom
    );
    finalTop = adjusted.topMD;
    finalBottom = adjusted.bottomMD;

    const kept = splitAroundInterval(completionString.items, finalTop, finalBottom);
    kept.push(createEquipment(equipmentType, finalTop, finalBottom));
    kept.sort((a, b) => a.topMD - b.topMD);

    set({ completionString: { ...completionString, items: kept } });
  },

  placeAtDepth: (centerMD, equipmentType, lengthOverride) => {
    const { completionString } = get();
    const std = STANDARD_LENGTH[equipmentType];
    const length =
      lengthOverride ?? (std != null ? std : 5.0); // variable types default to 5m when drop-placed
    let topMD = centerMD - length / 2;
    let bottomMD = topMD + length;

    const adjusted = shiftIntervalAwayFromObstacles(
      completionString.items,
      topMD,
      bottomMD
    );
    topMD = adjusted.topMD;
    bottomMD = adjusted.bottomMD;

    const kept = splitAroundInterval(completionString.items, topMD, bottomMD);
    kept.push(createEquipment(equipmentType, topMD, bottomMD));
    kept.sort((a, b) => a.topMD - b.topMD);

    set({ completionString: { ...completionString, items: kept } });
  },

  moveEquipment: (id, newTopMD) => {
    const { completionString } = get();
    const target = completionString.items.find((i) => i.id === id);
    if (!target || target.type === 'blank_pipe') return;

    const length = target.length;
    const newBottomMD = newTopMD + length;

    // Remove the equipment from its old location (replace with blank pipe)
    const withoutTarget = completionString.items
      .filter((i) => i.id !== id)
      .concat(createBlankPipe(target.topMD, target.bottomMD));

    // Split around new location
    const kept = splitAroundInterval(withoutTarget, newTopMD, newBottomMD);

    // Create moved copy (preserve type-specific fields)
    const moved: CompletionEquipment = {
      ...target,
      topMD: newTopMD,
      bottomMD: newBottomMD,
      length,
    } as CompletionEquipment;
    kept.push(moved);

    const merged = mergeAdjacentBlankPipes(kept);
    set({ completionString: { ...completionString, items: merged } });
  },

  removeEquipment: (id) => {
    const { completionString } = get();
    const item = completionString.items.find((i) => i.id === id);
    if (!item || item.type === 'blank_pipe') return;

    const filtered = completionString.items.filter((i) => i.id !== id);
    filtered.push(createBlankPipe(item.topMD, item.bottomMD));
    const merged = mergeAdjacentBlankPipes(filtered);

    set({ completionString: { ...completionString, items: merged } });
  },

  duplicateEquipment: (id) => {
    const { completionString } = get();
    const original = completionString.items.find((i) => i.id === id);
    if (!original || original.type === 'blank_pipe') return;

    const length = original.length;
    // Place the duplicate directly below the original, shifting around any
    // existing obstacles as needed.
    let newTop = original.bottomMD;
    let newBottom = newTop + length;
    const adjusted = shiftIntervalAwayFromObstacles(
      completionString.items,
      newTop,
      newBottom
    );
    newTop = adjusted.topMD;
    newBottom = adjusted.bottomMD;

    const kept = splitAroundInterval(completionString.items, newTop, newBottom);
    const copy: CompletionEquipment = {
      ...original,
      id: uuidv4(),
      topMD: newTop,
      bottomMD: newBottom,
      length: newBottom - newTop,
    } as CompletionEquipment;
    kept.push(copy);
    kept.sort((a, b) => a.topMD - b.topMD);

    set({ completionString: { ...completionString, items: kept } });
  },

  updateEquipment: (id, updates) => {
    const { completionString } = get();
    const newItems = completionString.items.map((item): CompletionEquipment => {
      if (item.id !== id) return item;
      const updated = Object.assign({}, item, updates) as CompletionEquipment;
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
