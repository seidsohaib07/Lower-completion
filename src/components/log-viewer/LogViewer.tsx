import { useRef } from 'react';
import { useLogDataStore } from '../../stores';
import { useSynchronizedScroll } from '../../hooks/use-synchronized-scroll';
import { DepthTrackCanvas } from './DepthTrackCanvas';
import { LogTrackCanvas } from './LogTrackCanvas';
import { TrackHeader } from './TrackHeader';

export function LogViewer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const tracks = useLogDataStore((s) => s.tracks);
  const logData = useLogDataStore((s) => s.logData);

  useSynchronizedScroll(containerRef);

  if (!logData) {
    return (
      <div className="flex-1 flex items-center justify-center text-[#64748b] text-sm">
        <div className="text-center">
          <p className="text-lg mb-1">No CPI Logs Loaded</p>
          <p className="text-xs">Click "Import CPI" to load log data</p>
        </div>
      </div>
    );
  }

  const visibleTracks = tracks.filter((t) => t.visible);

  return (
    <div ref={containerRef} className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Track headers */}
      <div className="flex shrink-0">
        <div className="shrink-0 h-10 flex items-center justify-center border-b border-[#1e293b]" style={{ width: 70 }}>
          <span className="text-[10px] text-[#64748b] font-semibold">DEPTH</span>
        </div>
        {visibleTracks.map((track) => (
          <div key={track.id} style={{ minWidth: track.width, flex: 1 }}>
            <TrackHeader trackConfig={track} />
          </div>
        ))}
      </div>

      {/* Track canvases */}
      <div className="flex flex-1 overflow-hidden">
        <DepthTrackCanvas />
        {visibleTracks.map((track) => (
          <LogTrackCanvas key={track.id} trackConfig={track} />
        ))}
      </div>
    </div>
  );
}
