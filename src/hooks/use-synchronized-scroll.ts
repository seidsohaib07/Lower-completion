import { useEffect } from 'react';
import { useViewportStore } from '../stores';

export function useSynchronizedScroll(containerRef: React.RefObject<HTMLElement | null>) {
  const scrollBy = useViewportStore((s) => s.scrollBy);
  const zoom = useViewportStore((s) => s.zoom);
  const pixelToDepth = useViewportStore((s) => s.pixelToDepth);
  const pixelsPerMeter = useViewportStore((s) => s.pixelsPerMeter);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handler = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (e.ctrlKey || e.metaKey) {
        // Zoom
        const factor = e.deltaY > 0 ? 0.9 : 1.1;
        const rect = el.getBoundingClientRect();
        const localY = e.clientY - rect.top;
        const anchorDepth = pixelToDepth(localY);
        zoom(factor, anchorDepth);
      } else {
        // Scroll
        const deltaMD = e.deltaY / pixelsPerMeter;
        scrollBy(deltaMD);
      }
    };

    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, [containerRef, scrollBy, zoom, pixelToDepth, pixelsPerMeter]);
}
