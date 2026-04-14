import { useViewportStore } from '../../stores';
import { EquipmentPalette } from './EquipmentPalette';
import { ZoomControls } from './ZoomControls';

export function MainToolbar() {
  const orientation = useViewportStore((s) => s.orientation);
  const toggleOrientation = useViewportStore((s) => s.toggleOrientation);

  return (
    <div className="flex items-center justify-between h-9 px-3 bg-[#0f172a] border-b border-[#1e293b] select-none shrink-0">
      <EquipmentPalette />

      <div className="flex items-center gap-2">
        <ZoomControls />

        <div className="w-px h-5 bg-[#334155] mx-1" />

        <button
          onClick={toggleOrientation}
          className="px-2 py-0.5 text-[10px] font-medium bg-[#1e293b] hover:bg-[#334155] text-[#94a3b8] rounded transition-colors"
          title={`Switch to ${orientation === 'vertical' ? 'horizontal' : 'vertical'} view`}
        >
          {orientation === 'vertical' ? 'H-View' : 'V-View'}
        </button>
      </div>
    </div>
  );
}
