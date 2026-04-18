import { useRef } from 'react';
import { useLogDataStore, useViewportStore, useUIStore } from '../../stores';
import { DEPTH_TRACK_WIDTH } from '../../constants';
import { useSynchronizedScroll } from '../../hooks/use-synchronized-scroll';
import { DepthTrackCanvas } from './DepthTrackCanvas';
import { LogTrackCanvas } from './LogTrackCanvas';
import { TrackHeader } from './TrackHeader';
import { PdfOverlayTrack } from './PdfOverlayTrack';

interface LogViewerProps {
  horizontalTrackHeight?: number;
}

export function LogViewer({ horizontalTrackHeight }: LogViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const tracks = useLogDataStore((s) => s.tracks);
  const logData = useLogDataStore((s) => s.logData);
  const pdfOverlay = useLogDataStore((s) => s.pdfOverlay);
  const topDepth = useViewportStore((s) => s.topDepth);
  const bottomDepth = useViewportStore((s) => s.bottomDepth);
  const pixelsPerMeter = useViewportStore((s) => s.pixelsPerMeter);
  const orientation = useViewportStore((s) => s.orientation);

  const depthMode = useViewportStore((s) => s.depthMode);
  const showDual = depthMode === 'TVD_MSL';
  const depthHeaderWidth = showDual ? DEPTH_TRACK_WIDTH + 50 : DEPTH_TRACK_WIDTH;

  useSynchronizedScroll(containerRef);

  const isHorizontal = orientation === 'horizontal';

  if (!logData && !pdfOverlay) {
    return (
      <div
        className="flex-1 flex items-center justify-center text-sm"
        style={{ color: 'var(--color-text-muted)' }}
      >
        <div className="text-center">
          <p className="text-lg mb-1">No CPI Logs Loaded</p>
          <p className="text-xs">Click "Import CPI", "PDF Overlay", or "Demo Well" to load data</p>
        </div>
      </div>
    );
  }

  const visibleTracks = tracks.filter((t) => t.visible);

  // In horizontal mode, calculate track widths to fit within the available height
  // (which is CSS width after rotation). Show at least 5 tracks without scrolling.
  let trackMinWidth: number | undefined;
  if (isHorizontal && horizontalTrackHeight && visibleTracks.length > 0) {
    const available = horizontalTrackHeight - depthHeaderWidth - 2;
    trackMinWidth = Math.max(35, Math.floor(available / Math.max(visibleTracks.length, 1)));
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 flex flex-col h-full overflow-hidden"
      style={{ background: 'var(--color-log-bg)' }}
    >
      {/* Headers */}
      <div className="flex shrink-0">
        <div
          className="shrink-0 flex items-center justify-center border-b"
          style={{ width: depthHeaderWidth, height: isHorizontal ? 24 : 40, borderColor: 'var(--color-border)' }}
        >
          {showDual ? (
            <div className="flex w-full">
              <span className="flex-1 text-center text-[9px] font-semibold" style={{ color: 'var(--color-text-muted)' }}>MD</span>
              <span className="flex-1 text-center text-[9px] font-semibold" style={{ color: 'var(--color-text-muted)' }}>TVD-MSL</span>
            </div>
          ) : (
            <span className="text-[10px] font-semibold" style={{ color: 'var(--color-text-muted)' }}>DEPTH</span>
          )}
        </div>
        {visibleTracks.map((track) => (
          <div
            key={track.id}
            style={{
              minWidth: trackMinWidth ?? track.width,
              maxWidth: trackMinWidth,
              flex: trackMinWidth ? `0 0 ${trackMinWidth}px` : 1,
            }}
          >
            <TrackHeader trackConfig={track} compact={isHorizontal} />
          </div>
        ))}
        {pdfOverlay && (
          <div
            className="flex items-center justify-center border-b"
            style={{ minWidth: 200, flex: 1, height: isHorizontal ? 24 : 40, borderColor: 'var(--color-border)' }}
          >
            <span
              className="text-[10px] font-semibold"
              style={{ color: 'var(--color-text-muted)' }}
            >
              PDF OVERLAY
            </span>
          </div>
        )}
      </div>

      {/* Track canvases */}
      <div className="flex flex-1 overflow-hidden">
        <DepthTrackCanvas />
        {visibleTracks.map((track) => (
          <LogTrackCanvas
            key={track.id}
            trackConfig={track}
            minWidthOverride={trackMinWidth}
          />
        ))}
        {pdfOverlay && (
          <PdfOverlayTrack
            overlay={pdfOverlay}
            topDepth={topDepth}
            bottomDepth={bottomDepth}
            pixelsPerMeter={pixelsPerMeter}
          />
        )}
      </div>
    </div>
  );
}
