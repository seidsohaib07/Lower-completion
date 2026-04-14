import { useRef, useState } from 'react';
import { useLogDataStore, useCompletionStore, useUIStore, useViewportStore } from '../../stores';
import { parseExcelCPILogs, parseExcelTally } from '../../utils/excel-import';
import { exportTallyToExcel } from '../../utils/excel-export';
import { exportSchematicImage, exportSchematicPDF } from '../../utils/image-export';
import { generateTally } from '../../utils/tally-calculator';
import { generateDemoLogData } from '../../utils/demo-data';
import { importPDFAsOverlay, extractCPIFromPDF } from '../../utils/pdf-import';
import { suggestCompletion } from '../../utils/suggest-completion';

function CompleteItLogo() {
  return (
    <svg width={24} height={24} viewBox="0 0 24 24" aria-hidden="true">
      {/* A stylized well bore with a completion screen "check" motif */}
      <defs>
        <linearGradient id="ci-pipe" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f59e0b" />
          <stop offset="1" stopColor="#b45309" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="20" height="20" rx="4" fill="var(--color-primary)" />
      {/* Wellbore */}
      <rect x="10" y="3" width="4" height="18" fill="url(#ci-pipe)" opacity="0.9" />
      <rect x="11" y="3" width="2" height="18" fill="#0f172a" opacity="0.5" />
      {/* Screen wraps */}
      <g stroke="#e2e8f0" strokeWidth="0.4" opacity="0.7">
        <line x1="10" y1="9" x2="14" y2="9" />
        <line x1="10" y1="11" x2="14" y2="11" />
        <line x1="10" y1="13" x2="14" y2="13" />
        <line x1="10" y1="15" x2="14" y2="15" />
      </g>
      {/* Check mark */}
      <path d="M6 14 L9 17 L18 8" stroke="#22c55e" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function AppHeader() {
  const cpiInputRef = useRef<HTMLInputElement>(null);
  const tallyInputRef = useRef<HTMLInputElement>(null);

  const [cpiImportChoice, setCpiImportChoice] = useState<null | { file: File }>(null);

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

  // Unified CPI import: accepts .xlsx, .csv, or .pdf. PDF offers overlay/extract choice.
  const handleCPIImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const name = file.name.toLowerCase();
    if (name.endsWith('.pdf')) {
      setCpiImportChoice({ file });
      return;
    }
    try {
      const data = await parseExcelCPILogs(file);
      setLogData(data);
      setTotalRange(data.minDepth, data.maxDepth);
      fitToData(data.minDepth, data.maxDepth, window.innerHeight - 120);
      if (completionString.items.length === 0) {
        initializeBlankPipe(data.minDepth, data.maxDepth);
      }
    } catch (err) {
      console.error('Failed to import CPI logs:', err);
      alert('Failed to import CPI logs. Check the file format.');
    }
  };

  const runPdfOverlay = async () => {
    if (!cpiImportChoice) return;
    const file = cpiImportChoice.file;
    setCpiImportChoice(null);
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
      if (completionString.items.length === 0) initializeBlankPipe(topMD, botMD);
    } catch (err) {
      console.error('PDF overlay import failed:', err);
      alert('PDF overlay import failed: ' + (err as Error).message);
    }
  };

  const runPdfExtract = async () => {
    if (!cpiImportChoice) return;
    const file = cpiImportChoice.file;
    setCpiImportChoice(null);
    try {
      const data = await extractCPIFromPDF(file);
      if (!data) {
        alert(
          'Could not extract curve data from the PDF.\nFalling back to visual overlay is recommended.'
        );
        return;
      }
      setLogData(data);
      setTotalRange(data.minDepth, data.maxDepth);
      fitToData(data.minDepth, data.maxDepth, window.innerHeight - 120);
      if (completionString.items.length === 0) initializeBlankPipe(data.minDepth, data.maxDepth);
    } catch (err) {
      console.error('PDF extraction failed:', err);
      alert('PDF extraction failed: ' + (err as Error).message);
    }
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

  const handleSuggestCompletion = () => {
    if (!logData) {
      alert('Load log data first (Demo Well or Import CPI), then use Suggest.');
      return;
    }
    const hangerMD = completionString.hangerMD ?? logData.minDepth;
    const tdMD = completionString.tdMD ?? logData.maxDepth;
    const items = suggestCompletion(logData, hangerMD, tdMD);
    setCompletionString({
      ...completionString,
      items,
      hangerMD,
      tdMD,
    });
  };

  const btn =
    'px-2.5 py-1 text-xs rounded transition-colors font-medium';
  const btnPrimary = `${btn} text-[color:var(--color-text)]`;

  return (
    <header
      className="flex items-center justify-between h-11 px-4 border-b select-none shrink-0"
      style={{ background: 'var(--color-surface-deep)', borderColor: 'var(--color-border)' }}
    >
      <div className="flex items-center gap-2">
        <CompleteItLogo />
        <h1 className="text-base font-bold tracking-tight">
          <span style={{ color: 'var(--color-accent)' }}>Complete</span>
          <span style={{ color: 'var(--color-text)' }}>It</span>
        </h1>
        {logData && (
          <span
            className="text-xs border-l pl-3 ml-1"
            style={{ color: 'var(--color-text-muted)', borderColor: 'var(--color-border)' }}
          >
            {logData.wellName}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <input
          ref={cpiInputRef}
          type="file"
          accept=".xlsx,.xls,.csv,.pdf"
          className="hidden"
          onChange={handleCPIImport}
        />
        <input ref={tallyInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleTallyImport} />

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
          title="Import CPI logs from Excel/CSV or PDF"
        >
          Import CPI
        </button>
        <button
          onClick={() => tallyInputRef.current?.click()}
          className={btnPrimary}
          style={{ background: 'var(--color-primary)' }}
        >
          Import Tally
        </button>
        <button
          onClick={handleSuggestCompletion}
          className={btnPrimary}
          style={{ background: 'var(--color-success)' }}
          title="Suggest completion based on loaded logs"
          disabled={!logData}
        >
          ✨ Suggest
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

      {cpiImportChoice && (
        <div
          className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center"
          onClick={() => setCpiImportChoice(null)}
        >
          <div
            className="p-5 rounded shadow-xl border max-w-sm"
            style={{
              background: 'var(--color-surface)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-semibold mb-2">How to import PDF?</h3>
            <p className="text-xs mb-4" style={{ color: 'var(--color-text-muted)' }}>
              We can either pin the PDF as a depth-aligned visual overlay, or
              attempt to extract numeric curve data from the PDF.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                className="px-2.5 py-1 text-xs rounded"
                style={{ background: 'var(--color-surface-light)', color: 'var(--color-text)' }}
                onClick={() => setCpiImportChoice(null)}
              >
                Cancel
              </button>
              <button
                className="px-2.5 py-1 text-xs rounded"
                style={{ background: 'var(--color-primary)', color: 'var(--color-text)' }}
                onClick={runPdfOverlay}
              >
                Overlay (image)
              </button>
              <button
                className="px-2.5 py-1 text-xs rounded"
                style={{ background: 'var(--color-success)', color: 'var(--color-text)' }}
                onClick={runPdfExtract}
              >
                Extract curves
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
