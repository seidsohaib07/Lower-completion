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
  const [activeTab, setActiveTab] = useState(TOOLBOX_GROUPS[0].name);

  const currentGroup = TOOLBOX_GROUPS.find((g) => g.name === activeTab) ?? TOOLBOX_GROUPS[0];

  const armTool = (type: EquipmentType) => {
    const toolId = `place_${type}` as const;
    setActiveTool(activeTool === toolId ? 'select' : toolId);
  };

  return (
    <div
      className="flex flex-col shrink-0 border-b select-none"
      style={{
        background: 'var(--color-surface-deep)',
        borderColor: 'var(--color-border)',
      }}
      data-no-export
    >
      {/* Browser-style tab bar */}
      <div
        className="flex items-end px-3 gap-1 pt-1"
        style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}
      >
        {TOOLBOX_GROUPS.map((group) => {
          const isActive = activeTab === group.name;
          const hasActiveTool = group.items.some((t) => activeTool === `place_${t}`);
          return (
            <button
              key={group.name}
              onClick={() => setActiveTab(group.name)}
              className="px-5 py-1.5 text-[10px] font-semibold tracking-wide transition-all relative"
              style={{
                background: isActive ? 'var(--color-surface-deep)' : 'transparent',
                color: hasActiveTool
                  ? 'var(--color-accent)'
                  : isActive
                  ? 'var(--color-text)'
                  : 'var(--color-text-muted)',
                borderTop: isActive ? '2px solid var(--color-primary)' : '2px solid transparent',
                borderLeft: isActive ? '1px solid var(--color-border)' : '1px solid transparent',
                borderRight: isActive ? '1px solid var(--color-border)' : '1px solid transparent',
                borderBottom: 'none',
                borderRadius: '8px 8px 0 0',
                marginBottom: isActive ? -1 : 0,
                zIndex: isActive ? 2 : 0,
              }}
            >
              {group.name}
              {hasActiveTool && (
                <span
                  className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full"
                  style={{ background: 'var(--color-accent)', verticalAlign: 'middle' }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Equipment items row — Select cursor first, then equipment */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 overflow-x-auto">
        {/* Select tool */}
        <button
          title="Select (S)"
          onClick={() => setActiveTool(activeTool === 'select' ? 'select' : 'select')}
          className="flex flex-col items-center gap-0.5 px-2 pt-1 pb-0.5 rounded transition-all shrink-0"
          style={{
            background: activeTool === 'select' ? 'var(--color-primary-light, rgba(59,130,246,0.15))' : 'transparent',
            border: activeTool === 'select' ? '1px solid var(--color-primary)' : '1px solid transparent',
            minWidth: 52,
          }}
        >
          <div
            style={{
              opacity: activeTool === 'select' ? 1 : 0.65,
            }}
          >
            <svg viewBox="0 0 24 24" width={28} height={28} fill="none">
              <path
                d="M5 3l14 9-7 1.5L9 21z"
                stroke={activeTool === 'select' ? 'var(--color-primary)' : 'var(--color-text-muted)'}
                strokeWidth="1.5"
                strokeLinejoin="round"
                fill={activeTool === 'select' ? 'var(--color-primary)' : 'none'}
              />
            </svg>
          </div>
          <span
            className="text-[8px] text-center leading-tight whitespace-nowrap"
            style={{ color: activeTool === 'select' ? 'var(--color-primary)' : 'var(--color-text-muted)', maxWidth: 56 }}
          >
            Select
          </span>
        </button>

        {/* Separator */}
        <div className="w-px h-8 shrink-0" style={{ background: 'var(--color-border)' }} />

        {/* Equipment items */}
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
              className="flex flex-col items-center gap-0.5 px-2 pt-1 pb-0.5 rounded transition-all shrink-0 cursor-grab active:cursor-grabbing"
              style={{
                background: isActive ? `${color}1a` : 'transparent',
                border: isActive ? `1px solid ${color}60` : '1px solid transparent',
                minWidth: 52,
              }}
            >
              <div
                style={{
                  filter: isActive ? 'none' : 'grayscale(80%) brightness(0.85)',
                  opacity: isActive ? 1 : 0.75,
                }}
              >
                <ToolboxIcon type={type} color={color} size={28} />
              </div>
              <span
                className="text-[8px] text-center leading-tight whitespace-nowrap"
                style={{ color: isActive ? color : 'var(--color-text-muted)', maxWidth: 56 }}
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
