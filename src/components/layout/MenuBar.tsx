import { useRef, useState, useEffect } from 'react';
import { useLogDataStore, useCompletionStore, useUIStore, useViewportStore } from '../../stores';
import { parseExcelCPILogs, parseExcelTally } from '../../utils/excel-import';
import { exportTallyToExcel } from '../../utils/excel-export';
import { exportSchematicImage, exportSchematicPDF } from '../../utils/image-export';
import { generateTally } from '../../utils/tally-calculator';
import { generateDemoLogData } from '../../utils/demo-data';
import { importPDFAsOverlay, extractCPIFromPDF } from '../../utils/pdf-import';
import { suggestCompletion } from '../../utils/suggest-completion';

interface MenuItem {
  label: string;
  onClick?: () => void;
  divider?: boolean;
  disabled?: boolean;
  shortcut?: string;
}

interface Menu {
  label: string;
  items: MenuItem[];
}

function useMenuBar() {
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
  const showTally = useUIStore((s) => s.showTally);
  const showProperties = useUIStore((s) => s.showProperties);
  const toggleProperties = useUIStore((s) => s.toggleProperties);
  const theme = useUIStore((s) => s.theme);
  const toggleTheme = useUIStore((s) => s.toggleTheme);
  const zoomIn = useViewportStore((s) => s.zoomIn);
  const zoomOut = useViewportStore((s) => s.zoomOut);

  const cpiInputRef = useRef<HTMLInputElement>(null);
  const tallyInputRef = useRef<HTMLInputElement>(null);
  const [cpiImportChoice, setCpiImportChoice] = useState<null | { file: File }>(null);

  const handleCPIFile = async (file: File) => {
    const name = file.name.toLowerCase();
    if (name.endsWith('.pdf')) { setCpiImportChoice({ file }); return; }
    try {
      const data = await parseExcelCPILogs(file);
      setLogData(data);
      setTotalRange(data.minDepth, data.maxDepth);
      fitToData(data.minDepth, data.maxDepth, window.innerHeight - 120);
      if (completionString.items.length === 0) initializeBlankPipe(data.minDepth, data.maxDepth);
    } catch { alert('Failed to import CPI logs. Check the file format.'); }
  };

  const handleCPIImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; e.target.value = '';
    if (file) await handleCPIFile(file);
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
    } catch { alert('Failed to import tally.'); }
    e.target.value = '';
  };

  const runPdfOverlay = async () => {
    if (!cpiImportChoice) return;
    const file = cpiImportChoice.file; setCpiImportChoice(null);
    try {
      const topStr = prompt('Top depth of PDF (m MD):', String(logData?.minDepth ?? 2500));
      const botStr = prompt('Bottom depth of PDF (m MD):', String(logData?.maxDepth ?? 3000));
      const topMD = parseFloat(topStr ?? ''); const botMD = parseFloat(botStr ?? '');
      if (!isFinite(topMD) || !isFinite(botMD) || botMD <= topMD) { alert('Invalid depth range.'); return; }
      const overlay = await importPDFAsOverlay(file, topMD, botMD);
      setPdfOverlay(overlay); setTotalRange(topMD, botMD);
      fitToData(topMD, botMD, window.innerHeight - 120);
      if (completionString.items.length === 0) initializeBlankPipe(topMD, botMD);
    } catch (err) { alert('PDF overlay failed: ' + (err as Error).message); }
  };

  const runPdfExtract = async () => {
    if (!cpiImportChoice) return;
    const file = cpiImportChoice.file; setCpiImportChoice(null);
    try {
      const data = await extractCPIFromPDF(file);
      if (!data) { alert('Could not extract curves. Try Overlay instead.'); return; }
      setLogData(data); setTotalRange(data.minDepth, data.maxDepth);
      fitToData(data.minDepth, data.maxDepth, window.innerHeight - 120);
      if (completionString.items.length === 0) initializeBlankPipe(data.minDepth, data.maxDepth);
    } catch (err) { alert('PDF extract failed: ' + (err as Error).message); }
  };

  const handleLoadDemo = () => {
    const data = generateDemoLogData();
    setLogData(data); setTotalRange(data.minDepth, data.maxDepth);
    fitToData(data.minDepth, data.maxDepth, window.innerHeight - 120);
    initializeBlankPipe(data.minDepth, data.maxDepth);
  };

  const handleSuggest = () => {
    if (!logData) { alert('Load log data first, then Suggest.'); return; }
    const hangerMD = completionString.hangerMD ?? logData.minDepth;
    const tdMD = completionString.tdMD ?? logData.maxDepth;
    setCompletionString({ ...completionString, items: suggestCompletion(logData, hangerMD, tdMD), hangerMD, tdMD });
  };

  const menus: Menu[] = [
    {
      label: 'File',
      items: [
        { label: 'Demo Well', onClick: handleLoadDemo },
        { divider: true, label: '' },
        { label: 'Import CPI Logs…', onClick: () => cpiInputRef.current?.click(), shortcut: 'Ctrl+O' },
        { label: 'Import Tally…', onClick: () => tallyInputRef.current?.click() },
        { divider: true, label: '' },
        { label: 'Export Tally (Excel)…', onClick: () => exportTallyToExcel(generateTally(completionString.items, completionString.wellName)), disabled: completionString.items.length === 0 },
        { label: 'Export Schematic PNG…', onClick: exportSchematicImage },
        { label: 'Export Schematic PDF…', onClick: exportSchematicPDF },
      ],
    },
    {
      label: 'Insert',
      items: [
        { label: '✨ Suggest Completion', onClick: handleSuggest, disabled: !logData },
      ],
    },
    {
      label: 'View',
      items: [
        { label: `${showToolbox ? '✓ ' : ''}Toolbox`, onClick: toggleToolbox },
        { label: `${showProperties ? '✓ ' : ''}Properties Panel`, onClick: toggleProperties },
        { label: `${showTally ? '✓ ' : ''}Tally Table`, onClick: toggleTally },
        { divider: true, label: '' },
        { label: orientation === 'vertical' ? '⇋ Switch to Horizontal' : '⇵ Switch to Vertical', onClick: toggleOrientation },
        { divider: true, label: '' },
        { label: 'Zoom In', onClick: zoomIn, shortcut: 'Ctrl+=' },
        { label: 'Zoom Out', onClick: zoomOut, shortcut: 'Ctrl+-' },
      ],
    },
    {
      label: 'Appearance',
      items: [
        { label: theme === 'dark' ? '☀ Light Mode' : '☾ Dark Mode', onClick: toggleTheme },
      ],
    },
    {
      label: 'Help',
      items: [
        { label: 'Keyboard Shortcuts', onClick: () => alert('Ctrl+Scroll: Zoom\nScroll: Pan\nRight-click: Equipment menu\nDrag from toolbox: Place') },
        { label: 'About Complete It', onClick: () => alert('Complete It — Lower Completion Design Tool\nBuilt for open-hole horizontal well completions.') },
      ],
    },
  ];

  return { menus, cpiInputRef, tallyInputRef, cpiImportChoice, setCpiImportChoice, runPdfOverlay, runPdfExtract, handleCPIImport, handleTallyImport };
}

export function MenuBar() {
  const { menus, cpiInputRef, tallyInputRef, cpiImportChoice, setCpiImportChoice, runPdfOverlay, runPdfExtract, handleCPIImport, handleTallyImport } = useMenuBar();
  const logData = useLogDataStore((s) => s.logData);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!openMenu) return;
    const handler = (e: MouseEvent) => {
      if (barRef.current && !barRef.current.contains(e.target as Node)) setOpenMenu(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [openMenu]);

  return (
    <>
      <input ref={cpiInputRef} type="file" accept=".xlsx,.xls,.csv,.pdf" className="hidden" onChange={handleCPIImport} />
      <input ref={tallyInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleTallyImport} />

      <nav
        ref={barRef}
        className="flex items-center h-7 px-1 select-none shrink-0 border-b"
        style={{
          background: 'var(--color-surface-deep)',
          borderColor: 'var(--color-border)',
        }}
      >
        {/* Logo mark */}
        <span
          className="text-[11px] font-bold tracking-tight mr-3 px-1"
          style={{ color: 'var(--color-accent)' }}
        >
          CompleteIt
        </span>

        {/* Well name badge */}
        {logData && (
          <span
            className="text-[10px] mr-3 px-2 py-0.5 rounded"
            style={{
              background: 'var(--color-surface)',
              color: 'var(--color-text-muted)',
              border: '1px solid var(--color-border)',
            }}
          >
            {logData.wellName}
          </span>
        )}

        {/* Menu items */}
        {menus.map((menu) => (
          <div key={menu.label} className="relative">
            <button
              className="px-2.5 h-7 text-[11px] rounded transition-colors"
              style={{
                color: openMenu === menu.label ? 'var(--color-text)' : 'var(--color-text-muted)',
                background: openMenu === menu.label ? 'var(--color-surface-light)' : 'transparent',
              }}
              onMouseDown={() => setOpenMenu(openMenu === menu.label ? null : menu.label)}
              onMouseEnter={() => openMenu && openMenu !== menu.label && setOpenMenu(menu.label)}
            >
              {menu.label}
            </button>
            {openMenu === menu.label && (
              <div
                className="absolute top-full left-0 mt-0.5 rounded border shadow-2xl py-1 z-[200] min-w-[200px]"
                style={{
                  background: 'var(--color-surface)',
                  borderColor: 'var(--color-border)',
                }}
              >
                {menu.items.map((item, idx) =>
                  item.divider ? (
                    <div key={idx} className="my-1 border-t" style={{ borderColor: 'var(--color-border)' }} />
                  ) : (
                    <button
                      key={idx}
                      disabled={item.disabled}
                      onClick={() => { item.onClick?.(); setOpenMenu(null); }}
                      className="flex items-center justify-between w-full px-3 py-1 text-[11px] text-left transition-colors hover:bg-[rgba(148,163,184,0.12)] disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ color: 'var(--color-text)' }}
                    >
                      <span>{item.label}</span>
                      {item.shortcut && (
                        <span className="ml-8 text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                          {item.shortcut}
                        </span>
                      )}
                    </button>
                  )
                )}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* PDF import choice modal */}
      {cpiImportChoice && (
        <div className="fixed inset-0 bg-black/60 z-[300] flex items-center justify-center" onClick={() => setCpiImportChoice(null)}>
          <div
            className="p-6 rounded-lg shadow-2xl border max-w-sm w-full mx-4"
            style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-semibold mb-1">Import PDF</h3>
            <p className="text-xs mb-4" style={{ color: 'var(--color-text-muted)' }}>
              Pin the PDF as a depth-aligned overlay, or attempt to extract curve data from it.
            </p>
            <div className="flex gap-2 justify-end">
              <button className="px-3 py-1.5 text-xs rounded border" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }} onClick={() => setCpiImportChoice(null)}>Cancel</button>
              <button className="px-3 py-1.5 text-xs rounded" style={{ background: 'var(--color-primary)', color: '#fff' }} onClick={runPdfOverlay}>Overlay (image)</button>
              <button className="px-3 py-1.5 text-xs rounded" style={{ background: 'var(--color-success)', color: '#fff' }} onClick={runPdfExtract}>Extract curves</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
