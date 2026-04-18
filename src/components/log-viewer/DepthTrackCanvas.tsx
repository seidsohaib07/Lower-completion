import { useRef, useEffect, useMemo } from 'react';
import { useCanvasRenderer } from '../../hooks/use-canvas-renderer';
import { renderDepthTrack } from '../../canvas/depth-track-renderer';
import { useViewportStore, useLogDataStore, useUIStore } from '../../stores';
import { DEPTH_TRACK_WIDTH } from '../../constants';

export function DepthTrackCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { canvasRef, width, height, requestRender } = useCanvasRenderer(containerRef);

  const topDepth = useViewportStore((s) => s.topDepth);
  const bottomDepth = useViewportStore((s) => s.bottomDepth);
  const pixelsPerMeter = useViewportStore((s) => s.pixelsPerMeter);
  const depthMode = useViewportStore((s) => s.depthMode);
  const rkbElevation = useViewportStore((s) => s.rkbElevation);
  const tvdOffset = useViewportStore((s) => s.tvdOffset);
  const mdToDisplay = useViewportStore((s) => s.mdToDisplay);
  const formationMarkers = useLogDataStore((s) => s.formationMarkers);
  const showFormationMarkers = useLogDataStore((s) => s.showFormationMarkers);
  const theme = useUIStore((s) => s.theme);

  const showDual = depthMode === 'TVD_MSL';

  const tvdMslFormatter = useMemo(() => {
    return (md: number) => md - tvdOffset - rkbElevation;
  }, [tvdOffset, rkbElevation]);

  const trackWidth = showDual ? DEPTH_TRACK_WIDTH + 50 : DEPTH_TRACK_WIDTH;

  useEffect(() => {
    if (width === 0 || height === 0) return;

    requestRender((ctx, w, h) => {
      if (showDual) {
        renderDepthTrack(ctx, w, h, topDepth, bottomDepth, pixelsPerMeter, 'MD', undefined, formationMarkers, showFormationMarkers, 'TVD-MSL', tvdMslFormatter);
      } else {
        const label = depthMode === 'MD' ? 'MD' : 'TVD-RKB';
        const formatter = depthMode === 'MD' ? undefined : mdToDisplay;
        renderDepthTrack(ctx, w, h, topDepth, bottomDepth, pixelsPerMeter, label, formatter, formationMarkers, showFormationMarkers);
      }
    });
  }, [width, height, topDepth, bottomDepth, pixelsPerMeter, theme, depthMode, rkbElevation, tvdOffset, mdToDisplay, formationMarkers, showFormationMarkers, showDual, tvdMslFormatter, requestRender]);

  return (
    <div ref={containerRef} className="h-full canvas-container shrink-0" style={{ width: trackWidth }}>
      <canvas ref={canvasRef} className="block" />
    </div>
  );
}
