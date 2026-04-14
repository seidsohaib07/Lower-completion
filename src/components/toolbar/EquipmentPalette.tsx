import { useUIStore } from '../../stores';
import type { ActiveTool } from '../../types';
import { EQUIPMENT_COLORS, EQUIPMENT_LABELS } from '../../constants';

// A compact set of frequent-use tools in the top bar. Full catalog lives in the vertical Toolbox.
const QUICK_TOOLS: { tool: ActiveTool; label: string; color: string }[] = [
  {
    tool: 'place_swell_packer',
    label: EQUIPMENT_LABELS.swell_packer,
    color: EQUIPMENT_COLORS.swell_packer,
  },
  {
    tool: 'place_sand_screen',
    label: EQUIPMENT_LABELS.sand_screen,
    color: EQUIPMENT_COLORS.sand_screen,
  },
  {
    tool: 'place_icd_screen',
    label: EQUIPMENT_LABELS.icd_screen,
    color: EQUIPMENT_COLORS.icd_screen,
  },
  {
    tool: 'place_perforation',
    label: EQUIPMENT_LABELS.perforation,
    color: EQUIPMENT_COLORS.perforation,
  },
];

export function EquipmentPalette() {
  const activeTool = useUIStore((s) => s.activeTool);
  const setActiveTool = useUIStore((s) => s.setActiveTool);

  return (
    <div className="flex items-center gap-1">
      <span className="text-[10px] mr-1 uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
        Quick:
      </span>
      {QUICK_TOOLS.map(({ tool, label, color }) => (
        <button
          key={tool}
          onClick={() => setActiveTool(activeTool === tool ? 'select' : tool)}
          className="px-2 py-0.5 text-[10px] font-medium rounded transition-all"
          style={{
            backgroundColor: activeTool === tool ? color + '30' : 'var(--color-surface-light)',
            color: activeTool === tool ? color : 'var(--color-text)',
            border: activeTool === tool ? `1px solid ${color}` : '1px solid transparent',
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
