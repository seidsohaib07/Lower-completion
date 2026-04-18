import { useState, useRef, useEffect } from 'react';
import { useUIStore } from '../../stores';
import type { EquipmentType } from '../../types';
import { EQUIPMENT_COLORS, EQUIPMENT_LABELS } from '../../constants';
import { ToolboxIcon } from './ToolboxIcon';

/**
 * Groups mirror the HYSYS/Photoshop pattern: each group shows ONE icon
 * (the last-used or first item). Click the small triangle → flyout of all
 * group members appears. Clicking a tool arms it. Icons are greyscale by
 * default and gain their colour on hover or when active.
 */

interface ToolboxGroup {
  name: string;
  items: EquipmentType[];
}

const TOOLBOX_GROUPS: ToolboxGroup[] = [
  { name: 'Tubulars',    items: ['blank_pipe', 'pup_joint', 'casing', 'tubing', 'wash_pipe'] },
  { name: 'Screens',     items: ['sand_screen', 'icd_screen', 'aicd_screen', 'sliding_sleeve'] },
  { name: 'Packers',     items: ['swell_packer', 'production_packer', 'constrictor'] },
  { name: 'Frac',        items: ['frac_sleeve', 'perforation'] },
  { name: 'Hangers',     items: ['liner_hanger', 'float_shoe', 'float_collar'] },
  { name: 'Accessories', items: ['centralizer'] },
];

export function Toolbox() {
  const activeTool = useUIStore((s) => s.activeTool);
  const setActiveTool = useUIStore((s) => s.setActiveTool);

  // Track the "pinned" (last-selected) item per group
  const [groupPinned, setGroupPinned] = useState<Record<string, EquipmentType>>(() =>
    Object.fromEntries(TOOLBOX_GROUPS.map((g) => [g.name, g.items[0]]))
  );
  const [flyout, setFlyout] = useState<string | null>(null);
  const toolboxRef = useRef<HTMLDivElement>(null);

  // Close flyout on outside click
  useEffect(() => {
    if (!flyout) return;
    const handler = (e: MouseEvent) => {
      if (toolboxRef.current && !toolboxRef.current.contains(e.target as Node)) {
        setFlyout(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [flyout]);

  const armTool = (type: EquipmentType) => {
    const toolId = `place_${type}` as const;
    setActiveTool(activeTool === toolId ? 'select' : toolId);
  };

  const selectFromFlyout = (groupName: string, type: EquipmentType) => {
    setGroupPinned((prev) => ({ ...prev, [groupName]: type }));
    armTool(type);
    setFlyout(null);
  };

  return (
    <div
      ref={toolboxRef}
      className="flex flex-col border-r shrink-0 overflow-y-auto overflow-x-visible"
      style={{
        width: 56,
        background: 'var(--color-surface-deep)',
        borderColor: 'var(--color-border)',
        zIndex: 40,
        position: 'relative',
      }}
    >
      {/* Header */}
      <div
        className="text-[8px] uppercase tracking-widest text-center py-1.5 border-b font-semibold select-none"
        style={{ color: 'var(--color-text-muted)', borderColor: 'var(--color-border)' }}
      >
        Tools
      </div>

      {/* Select tool */}
      <ToolSlot
        label="Select"
        active={activeTool === 'select'}
        onClick={() => setActiveTool('select')}
        title="Select / Move tool (S)"
      >
        <svg viewBox="0 0 24 24" width={22} height={22} fill="none">
          <path
            d="M5 3l14 9-7 1.5L9 21z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
            fill={activeTool === 'select' ? 'currentColor' : 'none'}
          />
        </svg>
      </ToolSlot>

      <div className="w-full my-1" style={{ height: 1, background: 'var(--color-border)' }} />

      {TOOLBOX_GROUPS.map((group) => {
        const pinnedType = groupPinned[group.name];
        const toolId = `place_${pinnedType}` as const;
        const isActive = activeTool === toolId;
        const hasFlyout = flyout === group.name;
        const hasOthers = group.items.length > 1;

        return (
          <div key={group.name} className="relative">
            {/* Main group button */}
            <button
              title={`${EQUIPMENT_LABELS[pinnedType]} — click to arm, ▸ for more`}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('application/x-completion-equipment', pinnedType);
                e.dataTransfer.effectAllowed = 'copy';
              }}
              onClick={() => armTool(pinnedType)}
              className="group w-full flex flex-col items-center gap-0.5 pt-2 pb-1 relative cursor-grab active:cursor-grabbing transition-all"
              style={{
                background: isActive
                  ? `${EQUIPMENT_COLORS[pinnedType]}22`
                  : 'transparent',
                outline: isActive ? `2px solid ${EQUIPMENT_COLORS[pinnedType]}` : 'none',
                outlineOffset: '-2px',
              }}
            >
              {/* Greyscale icon — coloured on hover or when active */}
              <div
                className="w-9 h-9 flex items-center justify-center rounded transition-all"
                style={{
                  filter: isActive ? 'none' : 'grayscale(100%) brightness(0.7)',
                  opacity: isActive ? 1 : 0.65,
                }}
              >
                <div className="group-hover:opacity-100 group-hover:[filter:none] transition-all"
                  style={{ filter: 'inherit', opacity: 'inherit' }}>
                  <ToolboxIcon type={pinnedType} color={EQUIPMENT_COLORS[pinnedType]} size={36} />
                </div>
              </div>

              {/* Label */}
              <span
                className="text-[8px] text-center leading-tight select-none"
                style={{ color: isActive ? EQUIPMENT_COLORS[pinnedType] : 'var(--color-text-muted)' }}
              >
                {EQUIPMENT_LABELS[pinnedType].split(' ')[0]}
              </span>
            </button>

            {/* Expand triangle — shows flyout */}
            {hasOthers && (
              <button
                className="absolute bottom-0.5 right-0.5 w-4 h-4 flex items-center justify-center rounded-sm opacity-40 hover:opacity-100 transition-opacity"
                style={{ color: 'var(--color-text-muted)' }}
                title={`More ${group.name}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setFlyout(hasFlyout ? null : group.name);
                }}
              >
                <svg viewBox="0 0 8 8" width={8} height={8}>
                  <path d="M2 2 L6 4 L2 6Z" fill="currentColor" />
                </svg>
              </button>
            )}

            {/* Flyout panel */}
            {hasFlyout && (
              <div
                className="absolute top-0 left-full ml-1 rounded border shadow-2xl py-1 z-50 min-w-[140px]"
                style={{
                  background: 'var(--color-surface)',
                  borderColor: 'var(--color-border)',
                }}
              >
                <div
                  className="text-[9px] uppercase font-semibold tracking-wider px-3 pb-1 pt-0.5 border-b"
                  style={{ color: 'var(--color-text-muted)', borderColor: 'var(--color-border)' }}
                >
                  {group.name}
                </div>
                {group.items.map((type) => {
                  const active = activeTool === `place_${type}`;
                  const color = EQUIPMENT_COLORS[type];
                  return (
                    <button
                      key={type}
                      className="flex items-center gap-2.5 w-full px-3 py-1.5 text-left transition-colors hover:bg-[rgba(148,163,184,0.1)]"
                      style={{
                        background: active ? `${color}18` : 'transparent',
                      }}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('application/x-completion-equipment', type);
                        e.dataTransfer.effectAllowed = 'copy';
                        setFlyout(null);
                      }}
                      onClick={() => selectFromFlyout(group.name, type)}
                    >
                      <div style={{ filter: active ? 'none' : 'grayscale(60%)' }}>
                        <ToolboxIcon type={type} color={color} size={24} />
                      </div>
                      <span
                        className="text-[10px] font-medium"
                        style={{ color: active ? color : 'var(--color-text)' }}
                      >
                        {EQUIPMENT_LABELS[type]}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ToolSlot({
  label,
  active,
  onClick,
  title,
  children,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="w-full flex flex-col items-center gap-0.5 pt-2 pb-1 transition-all"
      style={{
        color: active ? 'var(--color-accent)' : 'var(--color-text-muted)',
        background: active ? 'rgba(245,158,11,0.12)' : 'transparent',
        outline: active ? '2px solid var(--color-accent)' : 'none',
        outlineOffset: '-2px',
      }}
    >
      {children}
      <span className="text-[8px] uppercase tracking-wider">{label}</span>
    </button>
  );
}
