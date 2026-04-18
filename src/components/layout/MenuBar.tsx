import { useRef, useState, useEffect, useCallback } from 'react';
import { useLogDataStore, useCompletionStore, useUIStore, useViewportStore, useSelectionStore } from '../../stores';
import { parseExcelCPILogs, parseExcelTally } from '../../utils/excel-import';
import { exportTallyToExcel } from '../../utils/excel-export';
import { exportSchematicImage, exportSchematicPDF } from '../../utils/image-export';
import { generateTally } from '../../utils/tally-calculator';
import { generateDemoLogData } from '../../utils/demo-data';
import { importPDFAsOverlay, extractCPIFromPDF } from '../../utils/pdf-import';
import { suggestCompletion } from '../../utils/suggest-completion';
import { parseLASFile } from '../../utils/las-import';
import { EQUIPMENT_LABELS } from '../../constants';
import type { EquipmentType } from '../../types';

/* ── Menu data types ──────────────────────────────────────────────────── */

interface MenuItem {
  label: string;
  onClick?: () => void;
  divider?: boolean;
  disabled?: boolean;
  shortcut?: string;
  children?: MenuItem[];         // submenu items (shown on hover →)
}

interface Menu {
  label: string;
  items: MenuItem[];
}

/* ── Toolbox groups (reused in Insert menu) ───────────────────────────── */

interface EqGroup { name: string; items: EquipmentType[] }
const EQ_GROUPS: EqGroup[] = [
  { name: 'Tubulars',    items: ['blank_pipe', 'pup_joint', 'casing', 'tubing', 'wash_pipe'] },
  { name: 'Screens',     items: ['sand_screen', 'icd_screen', 'aicd_screen', 'sliding_sleeve'] },
  { name: 'Packers',     items: ['swell_packer', 'production_packer', 'constrictor'] },
  { name: 'Frac',        items: ['frac_sleeve', 'perforation'] },
  { name: 'Hangers',     items: ['liner_hanger', 'float_shoe', 'float_collar'] },
  { name: 'Accessories', items: ['centralizer'] },
];

/* ── Hook: builds the full menu model ─────────────────────────────────── */

function useMenuBar() {
  const logData          = useLogDataStore((s) => s.logData);
  const setLogData       = useLogDataStore((s) => s.setLogData);
  const setPdfOverlay    = useLogDataStore((s) => s.setPdfOverlay);
  const completionString = useCompletionStore((s) => s.completionString);
  const initializeBlankPipe = useCompletionStore((s) => s.initializeBlankPipe);
  const setCompletionString = useCompletionStore((s) => s.setCompletionString);
  const fitToData        = useViewportStore((s) => s.fitToData);
  const setTotalRange    = useViewportStore((s) => s.setTotalRange);
  const toggleOrientation= useViewportStore((s) => s.toggleOrientation);
  const orientation      = useViewportStore((s) => s.orientation);
  const toggleTally      = useUIStore((s) => s.toggleTally);
  const toggleToolbox    = useUIStore((s) => s.toggleToolbox);
  const showToolbox      = useUIStore((s) => s.showToolbox);
  const showTally        = useUIStore((s) => s.showTally);
  const showProperties   = useUIStore((s) => s.showProperties);
  const toggleProperties = useUIStore((s) => s.toggleProperties);
  const theme            = useUIStore((s) => s.theme);
  const toggleTheme      = useUIStore((s) => s.toggleTheme);
  const zoomIn           = useViewportStore((s) => s.zoomIn);
  const zoomOut          = useViewportStore((s) => s.zoomOut);
  const setActiveTool    = useUIStore((s) => s.setActiveTool);
  const activeTool       = useUIStore((s) => s.activeTool);
  const selection        = useSelectionStore((s) => s.selection);
  const clearSelection   = useSelectionStore((s) => s.clearSelection);
  const removeEquipment  = useCompletionStore((s) => s.removeEquipment);
  const duplicateEquipment = useCompletionStore((s) => s.duplicateEquipment);

  const addFormationMarkers = useLogDataStore((s) => s.addFormationMarkers);
  const showFormationMarkers = useLogDataStore((s) => s.showFormationMarkers);
  const toggleFormationMarkers = useLogDataStore((s) => s.toggleFormationMarkers);
  const formationMarkers = useLogDataStore((s) => s.formationMarkers);

  const cpiInputRef      = useRef<HTMLInputElement>(null);
  const tallyInputRef    = useRef<HTMLInputElement>(null);
  const formationInputRef = useRef<HTMLInputElement>(null);
  const [cpiImportChoice, setCpiImportChoice] = useState<null | { file: File }>(null);

  /* ── CPI / LAS import handler ───────────────────────────────────────── */
  const handleCPIImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; e.target.value = '';
    if (!file) return;
    const name = file.name.toLowerCase();

    if (name.endsWith('.pdf')) { setCpiImportChoice({ file }); return; }

    try {
      let data;
      if (name.endsWith('.las')) {
        data = await parseLASFile(file);
      } else {
        data = await parseExcelCPILogs(file);
      }
      setLogData(data);
      setTotalRange(data.minDepth, data.maxDepth);
      fitToData(data.minDepth, data.maxDepth, window.innerHeight - 120);
      if (completionString.items.length === 0) initializeBlankPipe(data.minDepth, data.maxDepth);
    } catch (err) {
      console.error('CPI import failed:', err);
      alert('Failed to import logs. Check the file format.');
    }
  }, [setLogData, setTotalRange, fitToData, completionString.items.length, initializeBlankPipe]);

  /* ── Tally import handler ───────────────────────────────────────────── */
  const handleTallyImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    try {
      const cs = await parseExcelTally(file);
      setCompletionString(cs);
      if (cs.items.length > 0) {
        const minMD = cs.items[0].topMD;
        const maxMD = cs.items[cs.items.length - 1].bottomMD;
        setTotalRange(minMD, maxMD); fitToData(minMD, maxMD, window.innerHeight - 120);
      }
    } catch { alert('Failed to import tally.'); }
    e.target.value = '';
  }, [setCompletionString, setTotalRange, fitToData]);

  /* ── Formation markers import ───────────────────────────────────────── */
  const handleFormationImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    e.target.value = '';
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter((l) => l.trim());
      const markers: { name: string; topMD: number; bottomMD?: number }[] = [];
      for (let i = 0; i < lines.length; i++) {
        const parts = lines[i].split(/[,;\t]+/).map((p) => p.trim());
        if (i === 0 && isNaN(Number(parts[1]))) continue; // skip header
        const name = parts[0];
        const topMD = parseFloat(parts[1]);
        const bottomMD = parts[2] ? parseFloat(parts[2]) : undefined;
        if (name && isFinite(topMD)) markers.push({ name, topMD, bottomMD });
      }
      if (markers.length === 0) { alert('No valid formation markers found in file.'); return; }
      addFormationMarkers(markers);
    } catch (err) {
      console.error('Formation import failed:', err);
      alert('Failed to import formation markers.');
    }
  }, [addFormationMarkers]);

  /* ── PDF sub-handlers ───────────────────────────────────────────────── */
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

  /* ── Build the equipment submenus for Insert ────────────────────────── */
  const eqGroupMenus: MenuItem[] = EQ_GROUPS.map((g) => ({
    label: g.name,
    children: g.items.map((type) => ({
      label: EQUIPMENT_LABELS[type],
      onClick: () => setActiveTool(activeTool === `place_${type}` ? 'select' : `place_${type}` as any),
    })),
  }));

  /* ── Menus ──────────────────────────────────────────────────────────── */
  const menus: Menu[] = [
    {
      label: 'File',
      items: [
        { label: 'Demo Well', onClick: handleLoadDemo },
        { divider: true, label: '' },
        { label: 'Import CPI Logs (.LAS / Excel / CSV)…', onClick: () => cpiInputRef.current?.click(), shortcut: 'Ctrl+O' },
        { label: 'Import Tally…', onClick: () => tallyInputRef.current?.click() },
        { label: 'Import Formation Markers (CSV)…', onClick: () => formationInputRef.current?.click() },
        { divider: true, label: '' },
        { label: 'Export Tally (Excel)…', onClick: () => exportTallyToExcel(generateTally(completionString.items, completionString.wellName)), disabled: completionString.items.length === 0 },
        { label: 'Export Schematic PNG…', onClick: exportSchematicImage },
        { label: 'Export Schematic PDF…', onClick: exportSchematicPDF },
      ],
    },
    {
      label: 'Edit',
      items: [
        { label: `${activeTool === 'select' ? '✓ ' : ''}Select`, onClick: () => setActiveTool('select'), shortcut: 'S' },
        { divider: true, label: '' },
        {
          label: 'Remove Selected',
          disabled: selection.type !== 'equipment' || !selection.equipmentId,
          onClick: () => {
            if (selection.type === 'equipment' && selection.equipmentId) {
              removeEquipment(selection.equipmentId);
              clearSelection();
            }
          },
          shortcut: 'Del',
        },
        {
          label: 'Duplicate Selected',
          disabled: selection.type !== 'equipment' || !selection.equipmentId,
          onClick: () => {
            if (selection.type === 'equipment' && selection.equipmentId) {
              duplicateEquipment(selection.equipmentId);
            }
          },
          shortcut: 'Ctrl+D',
        },
      ],
    },
    {
      label: 'Insert',
      items: [
        { label: '✨ Suggest Completion', onClick: handleSuggest, disabled: !logData },
        { divider: true, label: '' },
        ...eqGroupMenus,
      ],
    },
    {
      label: 'View',
      items: [
        { label: `${showToolbox ? '✓ ' : ''}Toolbox`, onClick: toggleToolbox },
        { label: `${showProperties ? '✓ ' : ''}Properties Panel`, onClick: toggleProperties },
        { label: `${showTally ? '✓ ' : ''}Tally Table (Beta)`, onClick: toggleTally },
        { label: `${showFormationMarkers ? '✓ ' : ''}Formation Markers`, onClick: toggleFormationMarkers, disabled: formationMarkers.length === 0 },
        { divider: true, label: '' },
        { label: orientation === 'vertical' ? '⇋ Switch to Horizontal' : '⇵ Switch to Vertical', onClick: toggleOrientation },
        { divider: true, label: '' },
        { label: 'Zoom In', onClick: zoomIn, shortcut: 'Ctrl+=' },
        { label: 'Zoom Out', onClick: zoomOut, shortcut: 'Ctrl+-' },
        { divider: true, label: '' },
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

  return { menus, cpiInputRef, tallyInputRef, formationInputRef, cpiImportChoice, setCpiImportChoice, runPdfOverlay, runPdfExtract, handleCPIImport, handleTallyImport, handleFormationImport };
}

/* ── MenuBar component ────────────────────────────────────────────────── */

export function MenuBar() {
  const hook = useMenuBar();
  const { menus, cpiInputRef, tallyInputRef, formationInputRef, cpiImportChoice, setCpiImportChoice, runPdfOverlay, runPdfExtract, handleCPIImport, handleTallyImport, handleFormationImport } = hook;
  const logData = useLogDataStore((s) => s.logData);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [hoveredSub, setHoveredSub] = useState<string | null>(null);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!openMenu) return;
    const handler = (e: MouseEvent) => {
      if (barRef.current && !barRef.current.contains(e.target as Node)) { setOpenMenu(null); setHoveredSub(null); }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [openMenu]);

  return (
    <>
      <input ref={cpiInputRef} type="file" accept=".las,.xlsx,.xls,.csv,.pdf" className="hidden" onChange={handleCPIImport} />
      <input ref={tallyInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleTallyImport} />
      <input ref={formationInputRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleFormationImport} />

      <nav
        ref={barRef}
        className="flex items-center h-9 px-3 select-none shrink-0 border-b"
        style={{
          background: 'linear-gradient(180deg, var(--color-surface-deep) 0%, var(--color-surface) 100%)',
          borderColor: 'var(--color-border)',
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 mr-5">
          <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
            <rect x="2" y="2" width="28" height="28" rx="6" fill="url(#logo-grad)" />
            <path d="M10 8 L10 24 M22 8 L22 24" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />
            <rect x="8" y="10" width="16" height="3" rx="1" fill="rgba(255,255,255,0.9)" />
            <rect x="7" y="15" width="18" height="2.5" rx="1" fill="#fbbf24" />
            <rect x="8" y="19.5" width="16" height="3" rx="1" fill="rgba(255,255,255,0.9)" />
            <defs>
              <linearGradient id="logo-grad" x1="2" y1="2" x2="30" y2="30">
                <stop offset="0%" stopColor="#1e3a5f" />
                <stop offset="100%" stopColor="#0f172a" />
              </linearGradient>
            </defs>
          </svg>
          <span className="text-[13px] font-bold tracking-tight" style={{ color: 'var(--color-accent)' }}>
            Compl<span style={{ color: 'var(--color-text)' }}>Eat</span> it
          </span>
        </div>

        {/* Well name badge */}
        {logData && (
          <span
            className="text-[10px] mr-5 px-2.5 py-0.5 rounded"
            style={{ background: 'var(--color-surface)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}
          >
            {logData.wellName}
          </span>
        )}

        {/* Menu bar items with luxurious dividers */}
        <div className="flex items-center">
          {menus.map((menu, idx) => (
            <div key={menu.label} className="flex items-center">
              {idx > 0 && (
                <div className="flex items-center">
                  <span className="text-[11px] px-1.5" style={{ color: 'var(--color-border)' }}>|</span>
                </div>
              )}
              <div className="relative">
              <button
                className="px-4 py-1 text-[11px] rounded transition-colors font-medium tracking-wide"
                style={{
                  color: openMenu === menu.label ? 'var(--color-text)' : 'var(--color-text-muted)',
                  background: openMenu === menu.label ? 'var(--color-surface-light)' : 'transparent',
                }}
                onMouseDown={() => setOpenMenu(openMenu === menu.label ? null : menu.label)}
                onMouseEnter={() => { if (openMenu) setOpenMenu(menu.label); }}
              >
                {menu.label}
              </button>

              {openMenu === menu.label && (
                <div
                  className="absolute top-full left-0 mt-0.5 rounded border shadow-2xl py-1 z-[200] min-w-[220px]"
                  style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
                >
                  {menu.items.map((item, idx) => {
                    if (item.divider) {
                      return <div key={idx} className="my-1 border-t" style={{ borderColor: 'var(--color-border)' }} />;
                    }

                    // Item with children → show submenu on hover
                    if (item.children && item.children.length > 0) {
                      return (
                        <div
                          key={idx}
                          className="relative"
                          onMouseEnter={() => setHoveredSub(item.label)}
                          onMouseLeave={() => setHoveredSub(null)}
                        >
                          <div
                            className="flex items-center justify-between w-full px-3 py-1.5 text-[11px] text-left transition-colors hover:bg-[rgba(148,163,184,0.12)] cursor-default"
                            style={{ color: 'var(--color-text)' }}
                          >
                            <span>{item.label}</span>
                            <span style={{ color: 'var(--color-text-muted)', fontSize: '9px' }}>▸</span>
                          </div>
                          {hoveredSub === item.label && (
                            <div
                              className="absolute top-0 left-full ml-0.5 rounded border shadow-2xl py-1 z-[210] min-w-[180px]"
                              style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
                            >
                              {item.children.map((sub, si) => (
                                <button
                                  key={si}
                                  onClick={() => { sub.onClick?.(); setOpenMenu(null); setHoveredSub(null); }}
                                  className="flex items-center w-full px-3 py-1.5 text-[11px] text-left transition-colors hover:bg-[rgba(148,163,184,0.12)]"
                                  style={{ color: 'var(--color-text)' }}
                                >
                                  {sub.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    }

                    // Regular item
                    return (
                      <button
                        key={idx}
                        disabled={item.disabled}
                        onClick={() => { item.onClick?.(); setOpenMenu(null); }}
                        className="flex items-center justify-between w-full px-3 py-1.5 text-[11px] text-left transition-colors hover:bg-[rgba(148,163,184,0.12)] disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{ color: 'var(--color-text)' }}
                      >
                        <span>{item.label}</span>
                        {item.shortcut && (
                          <span className="ml-8 text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                            {item.shortcut}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            </div>
          ))}
        </div>
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
