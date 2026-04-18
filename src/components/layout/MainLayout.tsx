import { useEffect, useRef, useState } from 'react';
import { useUIStore, useViewportStore } from '../../stores';
import { LogViewer } from '../log-viewer/LogViewer';
import { CompletionViewer } from '../completion-viewer/CompletionViewer';
import { PropertiesPanel } from '../properties/PropertiesPanel';
import { PanelResizer } from './PanelResizer';
import { TallyTable } from '../tally/TallyTable';
import { Toolbox } from '../toolbox/Toolbox';

/**
 * Horizontal orientation: depth runs left → right.
 * We render the existing vertical canvases inside wrappers that are rotated
 * −90° around the origin. Correct transform is:
 *   translate(0, Hpx) rotate(-90deg)
 * which maps pre-corners (0,0)→(0,H), (H,0)→(0,0), (0,W)→(W,H), (H,W)→(W,0)
 * so that shallow depth appears on the LEFT and deep depth on the RIGHT.
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
    // Reuse panelSplit as ratio of the top half (logs) vs the bottom half (schematic).
    const logH = Math.max(120, size.h * panelSplit);
    const compH = Math.max(120, size.h - logH);

    /**
     * Return the style needed to render a (W × H) horizontal-display panel
     * using the existing vertical canvas layout. The canvas is sized at
     * (H × W) pre-rotation and transformed into the final horizontal box.
     */
    const rotatedBoxStyle = (W: number, H: number): React.CSSProperties => ({
      position: 'absolute',
      width: H,
      height: W,
      top: 0,
      left: 0,
      transformOrigin: '0 0',
      transform: `translate(0, ${H}px) rotate(-90deg)`,
    });

    return (
      <div className="flex flex-1 overflow-hidden">
        {showToolbox && (
          <div data-no-export>
            <Toolbox />
          </div>
        )}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <div
            ref={containerRef}
            className="flex-1 flex flex-col overflow-hidden relative"
            data-export-region
            data-export-area
          >
            <div
              className="shrink-0 overflow-hidden relative border-b"
              style={{ height: logH, width: '100%', borderColor: 'var(--color-border)' }}
            >
              <div style={rotatedBoxStyle(size.w, logH)}>
                <LogViewer />
              </div>
            </div>
            <div
              className="shrink-0 overflow-hidden relative"
              style={{ height: compH, width: '100%' }}
            >
              <div style={rotatedBoxStyle(size.w, compH)}>
                <CompletionViewer />
              </div>
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
        {showProperties && (
          <div data-no-export>
            <PropertiesPanel />
          </div>
        )}
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
          {showToolbox && (
            <div data-no-export>
              <Toolbox />
            </div>
          )}

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
