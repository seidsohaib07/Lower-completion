import { useRef } from 'react';
import { useLogDataStore, useCompletionStore, useUIStore, useViewportStore } from '../../stores';
import { parseExcelCPILogs, parseExcelTally } from '../../utils/excel-import';
import { exportTallyToExcel } from '../../utils/excel-export';
import { exportSchematicImage, exportSchematicPDF } from '../../utils/image-export';
import { generateTally } from '../../utils/tally-calculator';
import { generateDemoLogData } from '../../utils/demo-data';
import { importPDFAsOverlay, extractCPIFromPDF } from '../../utils/pdf-import';

export function AppHeader() {
  const cpiInputRef = useRef<HTMLInputElement>(null);
  const tallyInputRef = useRef<HTMLInputElement>(null);
  const pdfOverlayRef = useRef<HTMLInputElement>(null);
  const pdfExtractRef = useRef<HTMLInputElement>(null);

  const logData = useLogDataStore((s) => s.logData);
  const setLogData = useLogDataStore((s) => s.setLogData);
  const setPdfOverlay = useLogDataStore((s) => s.setPdfOverlay);
  const completionString = useCompletionStore((s) => s.completionString);
  const initializeBlankPipe = useCompletionStore((s) => s.initializeBlankPipe);
  const setCompletionString = useCompletionStore((s) => s.setCompletionString);

  const fitToData = useViewportStore((s) => s.fitToData);
  const setTotalRange = useViewportStore((s) => s.setTotalRange);
  const toggleOrientation = useViewportStore((s) => s.toggleOrientation);
  const orientation = useViewportStore((s) => s.orientation);

  const toggleTally = useUIStore((s) => s.toggleTally);
  const toggleToolbox = useUIStore((s) => s.toggleToolbox);
  const showToolbox = useUIStore((s) => s.showToolbox);
  const theme = useUIStore((s) => s.theme);
  const toggleTheme = useUIStore((s) => s.toggleTheme);

  const handleCPIImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await parseExcelCPILogs(file);
      setLogData(data);
      setTotalRange(data.minDepth, data.maxDepth);
      fitToData(data.minDepth, data.maxDepth, window.innerHeight - 120);
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

  const handlePdfOverlayImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const topStr = prompt('Enter top depth of PDF (meters, MD):', String(logData?.minDepth ?? 2500));
      const botStr = prompt('Enter bottom depth of PDF (meters, MD):', String(logData?.maxDepth ?? 3000));
      const topMD = parseFloat(topStr ?? '');
      const botMD = parseFloat(botStr ?? '');
      if (!isFinite(topMD) || !isFinite(botMD) || botMD <= topMD) {
        alert('Invalid depth range.');
        return;
      }
      const overlay = await importPDFAsOverlay(file, topMD, botMD);
      setPdfOverlay(overlay);
      setTotalRange(topMD, botMD);
      fitToData(topMD, botMD, window.innerHeight - 120);
      if (completionString.items.length === 0) {
        initializeBlankPipe(topMD, botMD);
      }
    } catch (err) {
      console.error('PDF overlay import failed:', err);
      alert('PDF overlay import failed: ' + (err as Error).message);
    }
    e.target.value = '';
  };

  const handlePdfExtract = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await extractCPIFromPDF(file);
      if (!data) {
        alert(
          'PDF data extraction did not find recognizable curve data.\n' +
          'Try the "Import PDF (overlay)" option instead to use the PDF as a visual reference.'
        );
        return;
      }
      setLogData(data);
      setTotalRange(data.minDepth, data.maxDepth);
      fitToData(data.minDepth, data.maxDepth, window.innerHeight - 120);
      if (completionString.items.length === 0) {
        initializeBlankPipe(data.minDepth, data.maxDepth);
      }
    } catch (err) {
      console.error('PDF extraction failed:', err);
      alert('PDF extraction failed: ' + (err as Error).message);
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

  const btn =
    'px-2.5 py-1 text-xs rounded transition-colors font-medium';
  const btnPrimary = `${btn} text-[color:var(--color-text)]`;

  return (
    <header
      className="flex items-center justify-between h-11 px-4 border-b select-none shrink-0"
      style={{ background: 'var(--color-surface-deep)', borderColor: 'var(--color-border)' }}
    >
      <div className="flex items-center gap-3">
        <h1 className="text-base font-bold tracking-tight">
          <span style={{ color: 'var(--color-accent)' }}>Complete</span>
          <span style={{ color: 'var(--color-text)' }}> It</span>
        </h1>
        <span
          className="text-xs border-l pl-3"
          style={{ color: 'var(--color-text-muted)', borderColor: 'var(--color-border)' }}
        >
          {logData ? logData.wellName : 'No well loaded'}
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        <input ref={cpiInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleCPIImport} />
        <input ref={tallyInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleTallyImport} />
        <input ref={pdfOverlayRef} type="file" accept=".pdf" className="hidden" onChange={handlePdfOverlayImport} />
        <input ref={pdfExtractRef} type="file" accept=".pdf" className="hidden" onChange={handlePdfExtract} />

        <button
          onClick={handleLoadDemo}
          className={btnPrimary}
          style={{ background: '#92400e' }}
        >
          Demo Well
        </button>
        <button
          onClick={() => cpiInputRef.current?.click()}
          className={btnPrimary}
          style={{ background: 'var(--color-primary)' }}
        >
          Import CPI
        </button>
        <button
          onClick={() => pdfOverlayRef.current?.click()}
          className={btnPrimary}
          style={{ background: 'var(--color-primary)' }}
          title="Import PDF as visual overlay aligned to depth"
        >
          PDF Overlay
        </button>
        <button
          onClick={() => pdfExtractRef.current?.click()}
          className={btnPrimary}
          style={{ background: 'var(--color-primary)' }}
          title="Attempt to extract curve data from PDF"
        >
          PDF Extract
        </button>
        <button
          onClick={() => tallyInputRef.current?.click()}
          className={btnPrimary}
          style={{ background: 'var(--color-primary)' }}
        >
          Import Tally
        </button>

        <div className="w-px h-5 mx-1" style={{ background: 'var(--color-border)' }} />

        <button
          onClick={handleExportTally}
          className={btn}
          style={{ background: 'var(--color-surface-light)', color: 'var(--color-text-muted)' }}
          disabled={completionString.items.length === 0}
        >
          Export Tally
        </button>
        <button
          onClick={() => exportSchematicImage()}
          className={btn}
          style={{ background: 'var(--color-surface-light)', color: 'var(--color-text-muted)' }}
        >
          Export PNG
        </button>
        <button
          onClick={() => exportSchematicPDF()}
          className={btn}
          style={{ background: 'var(--color-surface-light)', color: 'var(--color-text-muted)' }}
        >
          Export PDF
        </button>

        <div className="w-px h-5 mx-1" style={{ background: 'var(--color-border)' }} />

        <button
          onClick={toggleToolbox}
          className={btn}
          style={{
            background: showToolbox ? 'var(--color-primary)' : 'var(--color-surface-light)',
            color: 'var(--color-text)',
          }}
          title="Toggle equipment toolbox"
        >
          Toolbox
        </button>
        <button
          onClick={toggleOrientation}
          className={btn}
          style={{ background: 'var(--color-surface-light)', color: 'var(--color-text)' }}
          title="Rotate view: vertical ↔ horizontal"
        >
          {orientation === 'vertical' ? '⇋ Horizontal' : '⇵ Vertical'}
        </button>
        <button
          onClick={toggleTally}
          className={btn}
          style={{ background: 'var(--color-surface-light)', color: 'var(--color-text-muted)' }}
        >
          Tally
        </button>
        <button
          onClick={toggleTheme}
          className={btn}
          style={{ background: 'var(--color-surface-light)', color: 'var(--color-text)' }}
          title="Toggle light/dark theme"
        >
          {theme === 'dark' ? '☀ Light' : '☾ Dark'}
        </button>
      </div>
    </header>
  );
}
