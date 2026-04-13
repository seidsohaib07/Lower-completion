import type { CompletionEquipment, BlankPipe } from '../types';
import type { TallyRow, CompletionTally } from '../types';
import { EQUIPMENT_LABELS } from '../constants';

/**
 * Generate a completion tally from the completion string.
 * Blank pipes are split into individual joints.
 */
export function generateTally(
  items: CompletionEquipment[],
  wellName: string
): CompletionTally {
  const sorted = [...items].sort((a, b) => a.topMD - b.topMD);
  const rows: TallyRow[] = [];
  let sequence = 1;
  let cumulativeLength = 0;

  for (const item of sorted) {
    if (item.type === 'blank_pipe') {
      const bp = item as BlankPipe;
      const jointLength = bp.jointLength;
      let currentTop = bp.topMD;

      // Split into individual joints
      while (currentTop < bp.bottomMD - 0.01) {
        const jointBottom = Math.min(currentTop + jointLength, bp.bottomMD);
        const length = Math.round((jointBottom - currentTop) * 100) / 100;
        cumulativeLength += length;

        rows.push({
          sequence,
          equipmentType: 'blank_pipe',
          description: `${EQUIPMENT_LABELS.blank_pipe} ${bp.od}" ${bp.grade ?? ''}`.trim(),
          topMD: Math.round(currentTop * 100) / 100,
          bottomMD: Math.round(jointBottom * 100) / 100,
          length,
          cumulativeLength: Math.round(cumulativeLength * 100) / 100,
          od: bp.od,
          innerDiameter: bp.innerDiameter,
          comment: length < jointLength - 0.01 ? 'Pup joint' : undefined,
          equipmentId: bp.id,
        });

        sequence++;
        currentTop = jointBottom;
      }
    } else {
      // Non-blank equipment: single tally row
      const length = Math.round(item.length * 100) / 100;
      cumulativeLength += length;

      let description = EQUIPMENT_LABELS[item.type];
      if (item.type === 'swell_packer') {
        description += ` (${(item as any).swellMedium})`;
      } else if (item.type === 'sand_screen') {
        description += ` ${(item as any).meshSize}μm`;
      } else if (item.type === 'sliding_sleeve') {
        description += ` ${(item as any).sleeveType}`;
      }

      rows.push({
        sequence,
        equipmentType: item.type,
        description,
        topMD: Math.round(item.topMD * 100) / 100,
        bottomMD: Math.round(item.bottomMD * 100) / 100,
        length,
        cumulativeLength: Math.round(cumulativeLength * 100) / 100,
        od: item.od,
        innerDiameter: item.innerDiameter,
        comment: item.comment,
        equipmentId: item.id,
      });
      sequence++;
    }
  }

  return {
    wellName,
    date: new Date().toISOString().split('T')[0],
    preparedBy: '',
    rows,
    totalLength: Math.round(cumulativeLength * 100) / 100,
  };
}
