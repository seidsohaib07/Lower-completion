import { useCallback, useRef } from 'react';
import { useUIStore } from '../../stores';

export function PanelResizer() {
  const setPanelSplit = useUIStore((s) => s.setPanelSplit);
  const isDragging = useRef(false);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      isDragging.current = true;

      const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging.current) return;
        const parent = document.getElementById('main-panel-container');
        if (!parent) return;
        const rect = parent.getBoundingClientRect();
        const split = (e.clientX - rect.left) / rect.width;
        setPanelSplit(split);
      };

      const handleMouseUp = () => {
        isDragging.current = false;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    },
    [setPanelSplit]
  );

  return (
    <div
      className="w-1.5 bg-[#1e293b] hover:bg-[#2d6a9f] cursor-col-resize shrink-0 transition-colors active:bg-[#f59e0b]"
      onMouseDown={handleMouseDown}
    />
  );
}
