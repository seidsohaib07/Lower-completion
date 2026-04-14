import { useViewportStore, useLogDataStore } from '../../stores';

export function ZoomControls() {
  const zoomIn = useViewportStore((s) => s.zoomIn);
  const zoomOut = useViewportStore((s) => s.zoomOut);
  const fitToData = useViewportStore((s) => s.fitToData);
  const logData = useLogDataStore((s) => s.logData);
  const pixelsPerMeter = useViewportStore((s) => s.pixelsPerMeter);

  const handleFit = () => {
    if (logData) {
      fitToData(logData.minDepth, logData.maxDepth, window.innerHeight - 120);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <span className="text-[10px] text-[#64748b] mr-0.5">{pixelsPerMeter.toFixed(1)} px/m</span>
      <button
        onClick={zoomOut}
        className="w-6 h-6 flex items-center justify-center text-xs bg-[#1e293b] hover:bg-[#334155] text-[#94a3b8] rounded transition-colors"
        title="Zoom out"
      >
        -
      </button>
      <button
        onClick={zoomIn}
        className="w-6 h-6 flex items-center justify-center text-xs bg-[#1e293b] hover:bg-[#334155] text-[#94a3b8] rounded transition-colors"
        title="Zoom in"
      >
        +
      </button>
      <button
        onClick={handleFit}
        className="px-2 py-0.5 text-[10px] bg-[#1e293b] hover:bg-[#334155] text-[#94a3b8] rounded transition-colors"
        title="Fit to data"
      >
        Fit
      </button>
    </div>
  );
}
