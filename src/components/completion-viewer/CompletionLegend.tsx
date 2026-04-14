import { EQUIPMENT_COLORS, EQUIPMENT_LABELS } from '../../constants';
import type { EquipmentType } from '../../types';

const legendItems: EquipmentType[] = ['blank_pipe', 'swell_packer', 'sand_screen', 'sliding_sleeve'];

export function CompletionLegend() {
  return (
    <div className="flex items-center gap-3 px-3 h-7 bg-[#0f172a] border-t border-[#1e293b] shrink-0">
      {legendItems.map((type) => (
        <div key={type} className="flex items-center gap-1">
          <div
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: EQUIPMENT_COLORS[type] + '60', border: `1px solid ${EQUIPMENT_COLORS[type]}` }}
          />
          <span className="text-[9px] text-[#94a3b8]">{EQUIPMENT_LABELS[type]}</span>
        </div>
      ))}
    </div>
  );
}
