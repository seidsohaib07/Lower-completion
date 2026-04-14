import { useRef, useEffect } from 'react';
import { useCanvasRenderer } from '../../hooks/use-canvas-renderer';
import { renderLogTrack } from '../../canvas/log-track-renderer';
import { useViewportStore, useLogDataStore } from '../../stores';
import type { TrackConfig } from '../../types';
import { getCurveByName } from '../../utils/log-processing';

interface LogTrackCanvasProps {
  trackConfig: TrackConfig;
}

export function LogTrackCanvas({ trackConfig }: LogTrackCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { canvasRef, width, height, requestRender } = useCanvasRenderer(containerRef);

  const topDepth = useViewportStore((s) => s.topDepth);
  const bottomDepth = useViewportStore((s) => s.bottomDepth);
  const pixelsPerMeter = useViewportStore((s) => s.pixelsPerMeter);
  const logData = useLogDataStore((s) => s.logData);

  useEffect(() => {
    if (width === 0 || height === 0) return;

    const curveName = trackConfig.curveNames[0];
    const curve = logData ? getCurveByName(logData.curves, curveName) : undefined;
    const depthCurve = logData?.depthCurve ?? [];

    requestRender((ctx, w, h) => {
      renderLogTrack(ctx, w, h, topDepth, bottomDepth, pixelsPerMeter, trackConfig, curve, depthCurve);
    });
  }, [width, height, topDepth, bottomDepth, pixelsPerMeter, trackConfig, logData, requestRender]);

  return (
    <div ref={containerRef} className="flex-1 h-full canvas-container" style={{ minWidth: trackConfig.width }}>
      <canvas ref={canvasRef} className="block" />
    </div>
  );
}
