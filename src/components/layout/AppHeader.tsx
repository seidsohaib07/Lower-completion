import { useRef } from 'react';
import { useLogDataStore, useCompletionStore, useUIStore, useViewportStore } from '../../stores';
import { parseExcelCPILogs, parseExcelTally } from '../../utils/excel-import';
import { exportTallyToExcel } from '../../utils/excel-export';
import { exportSchematicImage, exportSchematicPDF } from '../../utils/image-export';
import { generateTally } from '../../utils/tally-calculator';
import { generateDemoLogData } from '../../utils/demo-data';

export function AppHeader() {
  const cpiInputRef = useRef<HTMLInputElement>(null);
  const tallyInputRef = useRef<HTMLInputElement>(null);
  const logData = useLogDataStore((s) => s.logData);
  const setLogData = useLogDataStore((s) => s.setLogData);
  const completionString = useCompletionStore((s) => s.completionString);
  const initializeBlankPipe = useCompletionStore((s) => s.initializeBlankPipe);
  const setCompletionString = useCompletionStore((s) => s.setCompletionString);
  const fitToData = useViewportStore((s) => s.fitToData);
  const setTotalRange = useViewportStore((s) => s.setTotalRange);
  const toggleTally = useUIStore((s) => s.toggleTally);

  const handleCPIImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await parseExcelCPILogs(file);
      setLogData(data);
      setTotalRange(data.minDepth, data.maxDepth);
      fitToData(data.minDepth, data.maxDepth, window.innerHeight - 120);
      // Initialize blank pipe over the log range
      initializeBlankPipe(data.minDepth, data.maxDepth);
    } catch (err) {
      console.error('Failed to import CPI logs:', err);
      alert('Failed to import CPI logs. Check the file format.');
    }
    e.target.value = '';
  };

  const handleTallyImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const cs = await parseExcelTally(file);
      setCompletionString(cs);
      if (cs.items.length > 0) {
        const minMD = cs.items[0].topMD;
        const maxMD = cs.items[cs.items.length - 1].bottomMD;
        setTotalRange(minMD, maxMD);
        fitToData(minMD, maxMD, window.innerHeight - 120);
      }
    } catch (err) {
      console.error('Failed to import tally:', err);
      alert('Failed to import tally. Check the file format.');
    }
    e.target.value = '';
  };

  const handleLoadDemo = () => {
    const data = generateDemoLogData();
    setLogData(data);
    setTotalRange(data.minDepth, data.maxDepth);
    fitToData(data.minDepth, data.maxDepth, window.innerHeight - 120);
    initializeBlankPipe(data.minDepth, data.maxDepth);
  };

  const handleExportTally = () => {
    const tally = generateTally(completionString.items, completionString.wellName);
    exportTallyToExcel(tally);
  };

  const handleExportPNG = () => {
    exportSchematicImage();
  };

  const handleExportPDF = () => {
    exportSchematicPDF();
  };

  return (
    <header className="flex items-center justify-between h-11 px-4 bg-[#0f172a] border-b border-[#1e293b] select-none shrink-0">
      <div className="flex items-center gap-3">
        <h1 className="text-base font-bold tracking-tight">
          <span className="text-[#f59e0b]">Complete</span>
          <span className="text-[#e2e8f0]"> It</span>
        </h1>
        <span className="text-xs text-[#64748b] border-l border-[#334155] pl-3">
          {logData ? logData.wellName : 'No well loaded'}
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        <input ref={cpiInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleCPIImport} />
        <input ref={tallyInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleTallyImport} />

        <button
          onClick={handleLoadDemo}
          className="px-2.5 py-1 text-xs bg-[#92400e] hover:bg-[#b45309] text-[#e2e8f0] rounded transition-colors font-medium"
        >
          Demo Well
        </button>
        <button
          onClick={() => cpiInputRef.current?.click()}
          className="px-2.5 py-1 text-xs bg-[#1e3a5f] hover:bg-[#2d6a9f] text-[#e2e8f0] rounded transition-colors"
        >
          Import CPI
        </button>
        <button
          onClick={() => tallyInputRef.current?.click()}
          className="px-2.5 py-1 text-xs bg-[#1e3a5f] hover:bg-[#2d6a9f] text-[#e2e8f0] rounded transition-colors"
        >
          Import Tally
        </button>

        <div className="w-px h-5 bg-[#334155] mx-1" />

        <button
          onClick={handleExportTally}
          className="px-2.5 py-1 text-xs bg-[#1e293b] hover:bg-[#334155] text-[#94a3b8] rounded transition-colors"
          disabled={completionString.items.length === 0}
        >
          Export Tally
        </button>
        <button
          onClick={handleExportPNG}
          className="px-2.5 py-1 text-xs bg-[#1e293b] hover:bg-[#334155] text-[#94a3b8] rounded transition-colors"
        >
          Export PNG
        </button>
        <button
          onClick={handleExportPDF}
          className="px-2.5 py-1 text-xs bg-[#1e293b] hover:bg-[#334155] text-[#94a3b8] rounded transition-colors"
        >
          Export PDF
        </button>

        <div className="w-px h-5 bg-[#334155] mx-1" />

        <button
          onClick={toggleTally}
          className="px-2.5 py-1 text-xs bg-[#1e293b] hover:bg-[#334155] text-[#94a3b8] rounded transition-colors"
        >
          Tally
        </button>
      </div>
    </header>
  );
}
