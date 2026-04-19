import { useRef, useEffect } from 'react';
import { useCanvasRenderer } from '../../hooks/use-canvas-renderer';
import { renderLogTrack } from '../../canvas/log-track-renderer';
import { useViewportStore, useLogDataStore, useUIStore } from '../../stores';
import type { TrackConfig } from '../../types';
import { getCurveByName } from '../../utils/log-processing';

interface LogTrackCanvasProps {
  trackConfig: TrackConfig;
  minWidthOverride?: number;
}

export function LogTrackCanvas({ trackConfig, minWidthOverride }: LogTrackCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { canvasRef, width, height, requestRender } = useCanvasRenderer(containerRef);

  const topDepth = useViewportStore((s) => s.topDepth);
  const bottomDepth = useViewportStore((s) => s.bottomDepth);
  const pixelsPerMeter = useViewportStore((s) => s.pixelsPerMeter);
  const logData = useLogDataStore((s) => s.logData);
  const formationMarkers = useLogDataStore((s) => s.formationMarkers);
  const showFormationMarkers = useLogDataStore((s) => s.showFormationMarkers);
  const theme = useUIStore((s) => s.theme);

  useEffect(() => {
    if (width === 0 || height === 0) return;

    const curveName = trackConfig.curveNames[0];
    const curve = logData ? getCurveByName(logData.curves, curveName) : undefined;
    const depthCurve = logData?.depthCurve ?? [];

    requestRender((ctx, w, h) => {
      renderLogTrack(ctx, w, h, topDepth, bottomDepth, pixelsPerMeter, trackConfig, curve, depthCurve, formationMarkers, showFormationMarkers);
    });
  }, [width, height, topDepth, bottomDepth, pixelsPerMeter, trackConfig, logData, theme, formationMarkers, showFormationMarkers, requestRender]);

  return (
    <div
      ref={containerRef}
      className="h-full canvas-container"
      style={{
        minWidth: minWidthOverride ?? trackConfig.width,
        maxWidth: minWidthOverride,
        flex: minWidthOverride ? `0 0 ${minWidthOverride}px` : 1,
      }}
    >
      <canvas ref={canvasRef} className="block" />
    </div>
  );
}
