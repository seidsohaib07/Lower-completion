import { useRef, useEffect, useCallback, useState } from 'react';

interface CanvasRendererResult {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  width: number;
  height: number;
  requestRender: (renderFn: (ctx: CanvasRenderingContext2D, w: number, h: number) => void) => void;
}

export function useCanvasRenderer(containerRef: React.RefObject<HTMLElement | null>): CanvasRendererResult {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({ width, height });

        const canvas = canvasRef.current;
        if (canvas) {
          const dpr = window.devicePixelRatio || 1;
          canvas.width = width * dpr;
          canvas.height = height * dpr;
          canvas.style.width = `${width}px`;
          canvas.style.height = `${height}px`;

          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.scale(dpr, dpr);
          }
        }
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [containerRef]);

  const requestRender = useCallback(
    (renderFn: (ctx: CanvasRenderingContext2D, w: number, h: number) => void) => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }

      rafRef.current = requestAnimationFrame(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        ctx.save();
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        renderFn(ctx, dimensions.width, dimensions.height);
        ctx.restore();
      });
    },
    [dimensions.width, dimensions.height]
  );

  return {
    canvasRef,
    width: dimensions.width,
    height: dimensions.height,
    requestRender,
  };
}
