import { useRef, useEffect } from 'react';
import { useCanvasRenderer } from '../../hooks/use-canvas-renderer';
import { renderDepthTrack } from '../../canvas/depth-track-renderer';
import { useViewportStore } from '../../stores';
import { DEPTH_TRACK_WIDTH } from '../../constants';

export function DepthTrackCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { canvasRef, width, height, requestRender } = useCanvasRenderer(containerRef);

  const topDepth = useViewportStore((s) => s.topDepth);
  const bottomDepth = useViewportStore((s) => s.bottomDepth);
  const pixelsPerMeter = useViewportStore((s) => s.pixelsPerMeter);

  useEffect(() => {
    if (width === 0 || height === 0) return;

    requestRender((ctx, w, h) => {
      renderDepthTrack(ctx, w, h, topDepth, bottomDepth, pixelsPerMeter);
    });
  }, [width, height, topDepth, bottomDepth, pixelsPerMeter, requestRender]);

  return (
    <div ref={containerRef} className="h-full canvas-container shrink-0" style={{ width: DEPTH_TRACK_WIDTH }}>
      <canvas ref={canvasRef} className="block" />
    </div>
  );
}
