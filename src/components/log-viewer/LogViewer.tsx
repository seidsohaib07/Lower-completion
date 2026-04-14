import { useRef } from 'react';
import { useLogDataStore, useViewportStore } from '../../stores';
import { useSynchronizedScroll } from '../../hooks/use-synchronized-scroll';
import { DepthTrackCanvas } from './DepthTrackCanvas';
import { LogTrackCanvas } from './LogTrackCanvas';
import { TrackHeader } from './TrackHeader';
import { PdfOverlayTrack } from './PdfOverlayTrack';

export function LogViewer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const tracks = useLogDataStore((s) => s.tracks);
  const logData = useLogDataStore((s) => s.logData);
  const pdfOverlay = useLogDataStore((s) => s.pdfOverlay);
  const topDepth = useViewportStore((s) => s.topDepth);
  const bottomDepth = useViewportStore((s) => s.bottomDepth);
  const pixelsPerMeter = useViewportStore((s) => s.pixelsPerMeter);

  useSynchronizedScroll(containerRef);

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

  return (
    <div
      ref={containerRef}
      className="flex-1 flex flex-col h-full overflow-hidden"
      style={{ background: 'var(--color-log-bg)' }}
    >
      <div className="flex shrink-0">
        <div
          className="shrink-0 h-10 flex items-center justify-center border-b"
          style={{ width: 70, borderColor: 'var(--color-border)' }}
        >
          <span
            className="text-[10px] font-semibold"
            style={{ color: 'var(--color-text-muted)' }}
          >
            DEPTH
          </span>
        </div>
        {visibleTracks.map((track) => (
          <div key={track.id} style={{ minWidth: track.width, flex: 1 }}>
            <TrackHeader trackConfig={track} />
          </div>
        ))}
        {pdfOverlay && (
          <div
            className="h-10 flex items-center justify-center border-b"
            style={{ minWidth: 200, flex: 1, borderColor: 'var(--color-border)' }}
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

      <div className="flex flex-1 overflow-hidden">
        <DepthTrackCanvas />
        {visibleTracks.map((track) => (
          <LogTrackCanvas key={track.id} trackConfig={track} />
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
