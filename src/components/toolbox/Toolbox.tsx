import { useState } from 'react';
import { useUIStore } from '../../stores';
import type { EquipmentType } from '../../types';
import { EQUIPMENT_COLORS, EQUIPMENT_LABELS } from '../../constants';
import { ToolboxIcon } from './ToolboxIcon';

interface ToolboxGroup {
  name: string;
  items: EquipmentType[];
}

const TOOLBOX_GROUPS: ToolboxGroup[] = [
  { name: 'Open Hole',   items: ['sand_screen', 'icd_screen', 'aicd_screen', 'swell_packer', 'sliding_sleeve', 'blank_pipe', 'pup_joint', 'wash_pipe'] },
  { name: 'Cased Hole',  items: ['casing', 'tubing', 'production_packer', 'perforation', 'frac_sleeve'] },
  { name: 'Hangers',     items: ['liner_hanger', 'float_shoe', 'float_collar'] },
  { name: 'Accessories', items: ['centralizer', 'constrictor'] },
];

export function Toolbox() {
  const activeTool = useUIStore((s) => s.activeTool);
  const setActiveTool = useUIStore((s) => s.setActiveTool);
  const [activeGroup, setActiveGroup] = useState<string>(TOOLBOX_GROUPS[0].name);

  const armTool = (type: EquipmentType) => {
    const toolId = `place_${type}` as const;
    setActiveTool(activeTool === toolId ? 'select' : toolId);
  };

  const currentGroup = TOOLBOX_GROUPS.find((g) => g.name === activeGroup) ?? TOOLBOX_GROUPS[0];

  return (
    <div
      className="flex border-r shrink-0"
      style={{
        background: 'var(--color-surface-deep)',
        borderColor: 'var(--color-border)',
        zIndex: 40,
      }}
      data-no-export
    >
      {/* Column 1: Groups */}
      <div
        className="flex flex-col shrink-0 border-r overflow-y-auto"
        style={{ width: 48, borderColor: 'var(--color-border)' }}
      >
        {/* Select tool */}
        <button
          onClick={() => setActiveTool('select')}
          title="Select / Move (S)"
          className="w-full flex flex-col items-center gap-0.5 py-2 transition-all"
          style={{
            color: activeTool === 'select' ? 'var(--color-accent)' : 'var(--color-text-muted)',
            background: activeTool === 'select' ? 'rgba(245,158,11,0.12)' : 'transparent',
          }}
        >
          <svg viewBox="0 0 24 24" width={16} height={16} fill="none">
            <path
              d="M5 3l14 9-7 1.5L9 21z"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
              fill={activeTool === 'select' ? 'currentColor' : 'none'}
            />
          </svg>
          <span className="text-[7px] uppercase tracking-wider">Select</span>
        </button>

        <div className="w-full" style={{ height: 1, background: 'var(--color-border)' }} />

        {/* Group buttons */}
        {TOOLBOX_GROUPS.map((group) => {
          const isActive = activeGroup === group.name;
          const hasActiveTool = group.items.some((t) => activeTool === `place_${t}`);
          return (
            <button
              key={group.name}
              onClick={() => setActiveGroup(group.name)}
              onMouseEnter={() => setActiveGroup(group.name)}
              className="w-full flex flex-col items-center gap-0.5 py-2 transition-all"
              style={{
                background: isActive ? 'var(--color-surface-light)' : 'transparent',
                color: hasActiveTool ? 'var(--color-accent)' : isActive ? 'var(--color-text)' : 'var(--color-text-muted)',
                borderLeft: isActive ? '2px solid var(--color-accent)' : '2px solid transparent',
              }}
              title={group.name}
            >
              <span className="text-[8px] font-semibold text-center leading-tight select-none" style={{ maxWidth: 44 }}>
                {group.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* Column 2: Items in selected group */}
      <div
        className="flex flex-col overflow-y-auto"
        style={{ width: 100 }}
      >
        <div
          className="text-[7px] uppercase tracking-widest text-center py-1.5 border-b font-semibold select-none"
          style={{ color: 'var(--color-text-muted)', borderColor: 'var(--color-border)' }}
        >
          {currentGroup.name}
        </div>

        {currentGroup.items.map((type) => {
          const toolId = `place_${type}` as const;
          const isActive = activeTool === toolId;
          const color = EQUIPMENT_COLORS[type];
          return (
            <button
              key={type}
              title={EQUIPMENT_LABELS[type]}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('application/x-completion-equipment', type);
                e.dataTransfer.effectAllowed = 'copy';
              }}
              onClick={() => armTool(type)}
              className="flex items-center gap-1.5 w-full px-2 py-1.5 text-left transition-all hover:bg-[rgba(148,163,184,0.1)] cursor-grab active:cursor-grabbing"
              style={{
                background: isActive ? `${color}20` : 'transparent',
                borderLeft: isActive ? `2px solid ${color}` : '2px solid transparent',
              }}
            >
              <div
                className="shrink-0"
                style={{
                  filter: isActive ? 'none' : 'grayscale(80%) brightness(0.8)',
                  opacity: isActive ? 1 : 0.7,
                }}
              >
                <ToolboxIcon type={type} color={color} size={20} />
              </div>
              <span
                className="text-[8px] font-medium leading-tight select-none"
                style={{ color: isActive ? color : 'var(--color-text-muted)' }}
              >
                {EQUIPMENT_LABELS[type]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
