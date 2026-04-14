import { useUIStore } from '../../stores';
import type { EquipmentType } from '../../types';
import { EQUIPMENT_COLORS, EQUIPMENT_LABELS, STANDARD_LENGTH } from '../../constants';
import { ToolboxIcon } from './ToolboxIcon';

interface ToolboxGroup {
  name: string;
  items: EquipmentType[];
}

const TOOLBOX_GROUPS: ToolboxGroup[] = [
  { name: 'Tubulars', items: ['casing', 'tubing', 'blank_pipe', 'pup_joint', 'wash_pipe'] },
  { name: 'Screens', items: ['sand_screen', 'icd_screen', 'aicd_screen', 'sliding_sleeve'] },
  { name: 'Packers', items: ['swell_packer', 'production_packer', 'constrictor'] },
  { name: 'Frac', items: ['frac_sleeve', 'perforation'] },
  { name: 'Hangers', items: ['liner_hanger', 'float_shoe', 'float_collar'] },
  { name: 'Accessories', items: ['centralizer'] },
];

export function Toolbox() {
  const activeTool = useUIStore((s) => s.activeTool);
  const setActiveTool = useUIStore((s) => s.setActiveTool);

  return (
    <div
      className="flex flex-col border-r shrink-0 overflow-y-auto"
      style={{
        width: 88,
        background: 'var(--color-surface-light)',
        borderColor: 'var(--color-border)',
      }}
    >
      <div
        className="text-[9px] uppercase tracking-wider px-2 py-1.5 border-b text-center font-semibold"
        style={{ color: 'var(--color-text-muted)', borderColor: 'var(--color-border)' }}
      >
        Equipment
      </div>

      {TOOLBOX_GROUPS.map((group) => (
        <div key={group.name} className="flex flex-col">
          <div
            className="text-[8px] uppercase tracking-wider px-2 py-1 font-semibold border-b"
            style={{
              color: 'var(--color-text-muted)',
              background: 'var(--color-surface)',
              borderColor: 'var(--color-border)',
            }}
          >
            {group.name}
          </div>
          {group.items.map((type) => {
            const toolId = `place_${type}` as const;
            const active = activeTool === toolId;
            const color = EQUIPMENT_COLORS[type];
            const std = STANDARD_LENGTH[type];
            return (
              <button
                key={type}
                title={`${EQUIPMENT_LABELS[type]} — drag onto schematic or click to arm`}
                onClick={() => setActiveTool(active ? 'select' : toolId)}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('application/x-completion-equipment', type);
                  e.dataTransfer.effectAllowed = 'copy';
                }}
                className="flex flex-col items-center gap-1 py-2 px-1 border-b hover:bg-[rgba(148,163,184,0.08)] transition-colors cursor-grab active:cursor-grabbing"
                style={{
                  borderColor: 'var(--color-border)',
                  background: active ? color + '22' : undefined,
                  outline: active ? `1.5px solid ${color}` : undefined,
                }}
              >
                <div
                  className="w-12 h-12 flex items-center justify-center rounded"
                  style={{ background: 'var(--color-surface)' }}
                >
                  <ToolboxIcon type={type} color={color} size={44} />
                </div>
                <span
                  className="text-[9px] text-center leading-tight"
                  style={{ color: active ? color : 'var(--color-text)' }}
                >
                  {EQUIPMENT_LABELS[type]}
                </span>
                {std !== null && (
                  <span className="text-[8px]" style={{ color: 'var(--color-text-muted)' }}>
                    {std}m × N
                  </span>
                )}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
