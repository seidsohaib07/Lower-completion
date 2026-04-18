import { useState, useRef, useEffect } from 'react';
import { useUIStore, useViewportStore, useLogDataStore } from '../../stores';
import { ZoomControls } from './ZoomControls';

export function MainToolbar() {
  const activeTool = useUIStore((s) => s.activeTool);
  const setActiveTool = useUIStore((s) => s.setActiveTool);
  const depthMode = useViewportStore((s) => s.depthMode);
  const setDepthMode = useViewportStore((s) => s.setDepthMode);
  const rkbElevation = useViewportStore((s) => s.rkbElevation);
  const setRkbElevation = useViewportStore((s) => s.setRkbElevation);
  const tvdOffset = useViewportStore((s) => s.tvdOffset);
  const setTvdOffset = useViewportStore((s) => s.setTvdOffset);
  const tracks = useLogDataStore((s) => s.tracks);
  const updateTrack = useLogDataStore((s) => s.updateTrack);

  const [showLogFilter, setShowLogFilter] = useState(false);
  const [showDepthSettings, setShowDepthSettings] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const depthRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setShowLogFilter(false);
      }
      if (depthRef.current && !depthRef.current.contains(e.target as Node)) {
        setShowDepthSettings(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  return (
    <div
      className="flex items-center justify-between h-9 px-3 border-b select-none shrink-0"
      style={{
        background: 'var(--color-surface-deep)',
        borderColor: 'var(--color-border)',
      }}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={() => setActiveTool('select')}
          className="px-2 py-0.5 text-[10px] font-medium rounded transition-colors"
          style={{
            background:
              activeTool === 'select' ? 'var(--color-primary)' : 'var(--color-surface-light)',
            color: 'var(--color-text)',
          }}
        >
          Select / Move
        </button>
      </div>

      <div className="flex items-center gap-2">
        {/* Depth mode selector */}
        <div ref={depthRef} className="relative">
          <div
            className="flex items-center text-[10px] rounded overflow-hidden border"
            style={{ borderColor: 'var(--color-border)' }}
          >
            {(['MD', 'TVD_RKB', 'TVD_MSL'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setDepthMode(m)}
                className="px-1.5 py-0.5 transition-colors"
                style={{
                  background:
                    depthMode === m ? 'var(--color-primary)' : 'var(--color-surface-light)',
                  color: 'var(--color-text)',
                }}
                title={
                  m === 'MD'
                    ? 'Measured Depth (along wellbore)'
                    : m === 'TVD_RKB'
                    ? 'True Vertical Depth from Rotary Kelly Bushing'
                    : 'True Vertical Depth from Mean Sea Level'
                }
              >
                {m === 'TVD_RKB' ? 'TVD-RKB' : m === 'TVD_MSL' ? 'TVD-MSL' : 'MD'}
              </button>
            ))}
            <button
              onClick={() => setShowDepthSettings((s) => !s)}
              className="px-1.5 py-0.5"
              style={{ background: 'var(--color-surface)', color: 'var(--color-text-muted)' }}
              title="Depth reference settings"
            >
              ⚙
            </button>
          </div>
          {showDepthSettings && (
            <div
              className="absolute right-0 top-full mt-1 rounded shadow-lg border p-3 text-[11px] flex flex-col gap-2 z-50"
              style={{
                background: 'var(--color-surface)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text)',
                minWidth: 220,
              }}
            >
              <div className="text-[10px] uppercase font-semibold" style={{ color: 'var(--color-text-muted)' }}>
                Depth references
              </div>
              <label className="flex items-center justify-between gap-2">
                <span>MD → TVD_RKB offset (m)</span>
                <input
                  type="number"
                  step={0.1}
                  value={tvdOffset}
                  onChange={(e) => setTvdOffset(parseFloat(e.target.value) || 0)}
                  className="w-20 px-1 py-0.5 text-right rounded border"
                  style={{
                    background: 'var(--color-surface-light)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text)',
                  }}
                />
              </label>
              <label className="flex items-center justify-between gap-2">
                <span>RKB elevation above MSL (m)</span>
                <input
                  type="number"
                  step={0.1}
                  value={rkbElevation}
                  onChange={(e) => setRkbElevation(parseFloat(e.target.value) || 0)}
                  className="w-20 px-1 py-0.5 text-right rounded border"
                  style={{
                    background: 'var(--color-surface-light)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text)',
                  }}
                />
              </label>
              <div className="text-[9px]" style={{ color: 'var(--color-text-muted)' }}>
                TVD-MSL = MD − offset − RKB elevation
              </div>
            </div>
          )}
        </div>

        {/* Log visibility filter */}
        {tracks.length > 0 && (
          <div ref={filterRef} className="relative">
            <button
              onClick={() => setShowLogFilter((s) => !s)}
              className="px-2 py-0.5 text-[10px] font-medium rounded border"
              style={{
                background: 'var(--color-surface-light)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text)',
              }}
              title="Show/hide log tracks"
            >
              Logs ({tracks.filter((t) => t.visible).length}/{tracks.length})
            </button>
            {showLogFilter && (
              <div
                className="absolute right-0 top-full mt-1 rounded shadow-lg border py-1 text-[11px] z-50"
                style={{
                  background: 'var(--color-surface)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text)',
                  minWidth: 180,
                }}
              >
                <div className="px-2 pb-1 text-[9px] uppercase font-semibold" style={{ color: 'var(--color-text-muted)' }}>
                  Visible tracks
                </div>
                {tracks.map((t) => (
                  <label
                    key={t.id}
                    className="flex items-center gap-2 px-2 py-1 cursor-pointer hover:bg-[rgba(148,163,184,0.12)]"
                  >
                    <input
                      type="checkbox"
                      checked={t.visible}
                      onChange={() => updateTrack(t.id, { visible: !t.visible })}
                    />
                    <span
                      className="inline-block w-2 h-2 rounded-sm"
                      style={{ backgroundColor: t.color }}
                    />
                    <span>{t.curveNames[0]}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        <ZoomControls />
      </div>
    </div>
  );
}
