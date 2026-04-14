import { useUIStore } from '../../stores';
import { LogViewer } from '../log-viewer/LogViewer';
import { CompletionViewer } from '../completion-viewer/CompletionViewer';
import { PropertiesPanel } from '../properties/PropertiesPanel';
import { PanelResizer } from './PanelResizer';
import { TallyTable } from '../tally/TallyTable';

export function MainLayout() {
  const panelSplit = useUIStore((s) => s.panelSplit);
  const showProperties = useUIStore((s) => s.showProperties);
  const showTally = useUIStore((s) => s.showTally);

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div id="main-panel-container" className="flex flex-1 overflow-hidden" data-export-area>
        {/* Left Panel - Log Viewer */}
        <div className="flex flex-col overflow-hidden" style={{ width: `${panelSplit * 100}%` }}>
          <LogViewer />
        </div>

        <PanelResizer />

        {/* Right Panel - Completion Schematic */}
        <div className="flex flex-col overflow-hidden" style={{ width: `${(1 - panelSplit) * 100}%` }}>
          <CompletionViewer />
        </div>

        {/* Properties Panel */}
        {showProperties && <PropertiesPanel />}
      </div>

      {/* Tally Table (collapsible bottom) */}
      {showTally && (
        <div className="h-64 border-t border-[#1e293b] overflow-hidden shrink-0">
          <TallyTable />
        </div>
      )}
    </div>
  );
}
