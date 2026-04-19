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
  const isHorizontal = orientation === 'horizontal';

  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      const r = entries[0].contentRect;
      setSize({ w: r.width, h: r.height });
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  if (isHorizontal) {
    const propertiesW = showProperties ? 260 : 0;
    const containerW = size.w > 0 ? size.w : (window.innerWidth - propertiesW);
    const containerH = size.h > 0 ? size.h : (window.innerHeight - 120);
    const logH = Math.max(80, containerH * panelSplit);
    const compH = Math.max(80, containerH - logH);

    const rotatedBoxStyle = (visibleW: number, slotH: number): React.CSSProperties => ({
      position: 'absolute',
      width: slotH,
      height: visibleW,
      top: 0,
      left: 0,
      transformOrigin: '0 0',
      transform: `translate(0, ${slotH}px) rotate(-90deg)`,
    });

    return (
      <div className="flex flex-col flex-1 overflow-hidden">
        {showToolbox && <Toolbox />}
        <div className="flex flex-1 overflow-hidden">
          <div
            ref={containerRef}
            className="flex-1 flex flex-col overflow-hidden relative"
            data-export-region
            data-export-area
          >
            {/* Log panel — top section */}
            <div
              className="shrink-0 overflow-hidden relative border-b"
              style={{ height: logH, width: '100%', borderColor: 'var(--color-border)' }}
            >
              <div style={rotatedBoxStyle(containerW, logH)}>
                <LogViewer horizontalTrackHeight={logH} />
              </div>
            </div>
            {/* Completion panel — bottom section */}
            <div
              className="shrink-0 overflow-hidden relative"
              style={{ height: compH, width: '100%' }}
            >
              <div style={rotatedBoxStyle(containerW, compH)}>
                <CompletionViewer />
              </div>
            </div>
          </div>
          {showProperties && (
            <div data-no-export>
              <PropertiesPanel />
            </div>
          )}
        </div>
        {showTally && (
          <div
            className="h-64 border-t overflow-hidden shrink-0"
            style={{ borderColor: 'var(--color-border)' }}
            data-no-export
          >
            <TallyTable />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {showToolbox && <Toolbox />}
      <div ref={containerRef} className="flex flex-1 overflow-hidden relative">
        <div
          id="main-panel-container"
          className="flex overflow-hidden w-full h-full"
          data-export-area
        >
          <div
            className="flex flex-1 overflow-hidden"
            data-export-region
          >
            {/* Left Panel - Log Viewer */}
            <div
              className="flex flex-col overflow-hidden"
              style={{ width: `${panelSplit * 100}%` }}
            >
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
          </div>

          {showProperties && (
            <div data-no-export>
              <PropertiesPanel />
            </div>
          )}
        </div>
      </div>

      {showTally && (
        <div
          className="h-64 border-t overflow-hidden shrink-0"
          style={{ borderColor: 'var(--color-border)' }}
          data-no-export
        >
          <TallyTable />
        </div>
      )}
    </div>
  );
}
