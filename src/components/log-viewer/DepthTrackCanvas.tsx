import { useRef, useEffect } from 'react';
import { useCanvasRenderer } from '../../hooks/use-canvas-renderer';
import { renderDepthTrack } from '../../canvas/depth-track-renderer';
import { useViewportStore, useUIStore } from '../../stores';
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
  const theme = useUIStore((s) => s.theme);

  const label = depthMode === 'MD' ? 'MD' : depthMode === 'TVD_RKB' ? 'TVD-RKB' : 'TVD-MSL';

  useEffect(() => {
    if (width === 0 || height === 0) return;

    requestRender((ctx, w, h) => {
      renderDepthTrack(ctx, w, h, topDepth, bottomDepth, pixelsPerMeter, label, mdToDisplay);
    });
  }, [width, height, topDepth, bottomDepth, pixelsPerMeter, label, theme, depthMode, rkbElevation, tvdOffset, mdToDisplay, requestRender]);

  return (
    <div ref={containerRef} className="h-full canvas-container shrink-0" style={{ width: DEPTH_TRACK_WIDTH }}>
      <canvas ref={canvasRef} className="block" />
    </div>
  );
}
