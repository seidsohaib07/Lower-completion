import { useUIStore } from '../../stores';
import type { ActiveTool } from '../../types';
import { EQUIPMENT_COLORS } from '../../constants';

const tools: { tool: ActiveTool; label: string; color: string }[] = [
  { tool: 'select', label: 'Select', color: '#94a3b8' },
  { tool: 'place_swell_packer', label: 'Swell Packer', color: EQUIPMENT_COLORS.swell_packer },
  { tool: 'place_sand_screen', label: 'Sand Screen', color: EQUIPMENT_COLORS.sand_screen },
  { tool: 'place_sliding_sleeve', label: 'Sliding Sleeve', color: EQUIPMENT_COLORS.sliding_sleeve },
];

export function EquipmentPalette() {
  const activeTool = useUIStore((s) => s.activeTool);
  const setActiveTool = useUIStore((s) => s.setActiveTool);

  return (
    <div className="flex items-center gap-1">
      <span className="text-[10px] text-[#64748b] mr-1 uppercase tracking-wider">Tools:</span>
      {tools.map(({ tool, label, color }) => (
        <button
          key={tool}
          onClick={() => setActiveTool(tool)}
          className={`px-2 py-0.5 text-[10px] font-medium rounded transition-all ${
            activeTool === tool
              ? 'ring-1 ring-offset-1 ring-offset-[#0f172a]'
              : 'hover:bg-[#1e293b]'
          }`}
          style={{
            backgroundColor: activeTool === tool ? color + '30' : undefined,
            color: activeTool === tool ? color : '#94a3b8',
            border: activeTool === tool ? `1px solid ${color}` : '1px solid transparent',
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
