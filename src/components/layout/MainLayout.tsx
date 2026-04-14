import { useEffect, useRef, useState } from 'react';
import { useUIStore, useViewportStore } from '../../stores';
import { LogViewer } from '../log-viewer/LogViewer';
import { CompletionViewer } from '../completion-viewer/CompletionViewer';
import { PropertiesPanel } from '../properties/PropertiesPanel';
import { PanelResizer } from './PanelResizer';
import { TallyTable } from '../tally/TallyTable';
import { Toolbox } from '../toolbox/Toolbox';

/**
 * In horizontal orientation we want depth to run along X (left → right).
 * The simplest way to reuse all the existing Y-based canvas math is to:
 *   - stack the log viewer and schematic viewer vertically (top/bottom)
 *   - rotate each panel's content 90° clockwise via CSS, swapping its
 *     apparent width/height so that the canvas' internal Y axis becomes
 *     the screen's X axis.
 */
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
    // Stack panels vertically. Each panel's inner content is rotated 90° so
    // that the canvas' depth (Y) axis becomes the on-screen X axis.
    const halfH = size.h / 2;
    const logH = Math.max(120, halfH * panelSplit * 2); // reuse panelSplit as ratio between top (logs) and bottom (schematic)
    const compH = Math.max(120, size.h - logH);

    const rotatedBoxStyle = (w: number, h: number): React.CSSProperties => ({
      position: 'absolute',
      width: h,
      height: w,
      transform: `rotate(-90deg) translate(-${w}px, 0)`,
      transformOrigin: 'top left',
      top: 0,
      left: 0,
    });

    return (
      <div className="flex flex-1 overflow-hidden">
        {showToolbox && <Toolbox />}
        <div ref={containerRef} className="flex-1 flex flex-col overflow-hidden relative" data-export-area>
          <div className="shrink-0 overflow-hidden relative" style={{ height: logH, width: '100%' }}>
            <div style={rotatedBoxStyle(size.w, logH)}>
              <LogViewer />
            </div>
          </div>
          <div className="shrink-0 overflow-hidden relative" style={{ height: compH, width: '100%' }}>
            <div style={rotatedBoxStyle(size.w, compH)}>
              <CompletionViewer />
            </div>
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
        {showProperties && <PropertiesPanel />}
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div ref={containerRef} className="flex flex-1 overflow-hidden relative">
        <div
          id="main-panel-container"
          className="flex overflow-hidden w-full h-full"
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
