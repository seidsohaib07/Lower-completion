import { useEffect, useRef, useState } from 'react';
import { useUIStore, useViewportStore } from '../../stores';
import { LogViewer } from '../log-viewer/LogViewer';
import { CompletionViewer } from '../completion-viewer/CompletionViewer';
import { PropertiesPanel } from '../properties/PropertiesPanel';
import { PanelResizer } from './PanelResizer';
import { TallyTable } from '../tally/TallyTable';
import { Toolbox } from '../toolbox/Toolbox';

export function MainLayout() {
  const panelSplit = useUIStore((s) => s.panelSplit);
  const showProperties = useUIStore((s) => s.showProperties);
  const showTally = useUIStore((s) => s.showTally);
  const showToolbox = useUIStore((s) => s.showToolbox);
  const orientation = useViewportStore((s) => s.orientation);

  const outerRef = useRef<HTMLDivElement>(null);
  const [outerSize, setOuterSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    if (!outerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      const r = entries[0].contentRect;
      setOuterSize({ w: r.width, h: r.height });
    });
    ro.observe(outerRef.current);
    return () => ro.disconnect();
  }, []);

  const isHorizontal = orientation === 'horizontal';

  // When horizontal, rotate the inner content -90deg. Swap width/height so the
  // rotated element still fills its container.
  const rotatedStyle = isHorizontal
    ? {
        width: outerSize.h,
        height: outerSize.w,
        transform: `rotate(-90deg) translateY(-${outerSize.w}px)`,
        transformOrigin: 'top left',
      }
    : undefined;

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div ref={outerRef} className="flex flex-1 overflow-hidden relative">
        <div
          id="main-panel-container"
          className="flex overflow-hidden"
          style={
            rotatedStyle ?? {
              width: '100%',
              height: '100%',
            }
          }
          data-export-area
        >
          {showToolbox && <Toolbox />}

          {/* Left Panel - Log Viewer */}
          <div className="flex flex-col overflow-hidden" style={{ width: `${panelSplit * 100}%` }}>
            <LogViewer />
          </div>

          <PanelResizer />

          {/* Right Panel - Completion Schematic */}
          <div
            className="flex flex-col overflow-hidden"
            style={{ width: `${(1 - panelSplit) * 100}%` }}
          >
            <CompletionViewer />
          </div>

          {showProperties && <PropertiesPanel />}
        </div>

        {isHorizontal && (
          <div
            className="absolute bottom-2 right-2 text-[10px] px-2 py-1 rounded pointer-events-none"
            style={{
              background: 'var(--color-accent)',
              color: '#1a1a2e',
            }}
          >
            Horizontal view — switch to vertical for placement
          </div>
        )}
      </div>

      {showTally && (
        <div
          className="h-64 border-t overflow-hidden shrink-0"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <TallyTable />
        </div>
      )}
    </div>
  );
}
