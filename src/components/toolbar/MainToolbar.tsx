import { useUIStore } from '../../stores';
import { EquipmentPalette } from './EquipmentPalette';
import { ZoomControls } from './ZoomControls';

export function MainToolbar() {
  const activeTool = useUIStore((s) => s.activeTool);
  const setActiveTool = useUIStore((s) => s.setActiveTool);

  return (
    <div
      className="flex items-center justify-between h-9 px-3 border-b select-none shrink-0"
      style={{
        background: 'var(--color-surface-deep)',
        borderColor: 'var(--color-border)',
      }}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={() => setActiveTool('select')}
          className="px-2 py-0.5 text-[10px] font-medium rounded transition-colors"
          style={{
            background:
              activeTool === 'select' ? 'var(--color-primary)' : 'var(--color-surface-light)',
            color: 'var(--color-text)',
          }}
        >
          Select / Move
        </button>
        <EquipmentPalette />
      </div>

      <div className="flex items-center gap-2">
        <ZoomControls />
      </div>
    </div>
  );
}
