import type { PdfOverlay } from '../../stores/log-data-store';

interface Props {
  overlay: PdfOverlay;
  topDepth: number;
  bottomDepth: number;
  pixelsPerMeter: number;
}

/**
 * Renders a PDF page image as a depth-calibrated overlay. The image is scaled
 * so that the user-provided top/bottom MD values line up with the viewport depth range.
 */
export function PdfOverlayTrack({ overlay, topDepth, bottomDepth, pixelsPerMeter }: Props) {
  const visibleDepthSpan = bottomDepth - topDepth;
  const pdfDepthSpan = overlay.bottomMD - overlay.topMD;

  // PDF image maps vertically to [topMD..bottomMD]. The top of the image is at overlay.topMD.
  // Convert to container CSS: position PDF image so that its depth-aligned top aligns with viewport top.
  const imgHeightPx = pdfDepthSpan * pixelsPerMeter;
  const offsetTopPx = (overlay.topMD - topDepth) * pixelsPerMeter;
  const aspect = overlay.heightPx > 0 ? overlay.widthPx / overlay.heightPx : 1;
  const imgWidthPx = imgHeightPx * aspect;

  return (
    <div
      className="relative overflow-hidden border-l shrink-0"
      style={{
        minWidth: 200,
        maxWidth: 420,
        flex: 1,
        borderColor: 'var(--color-border)',
        background: 'var(--color-log-bg)',
      }}
    >
      <div className="absolute left-0 top-0 w-full h-full">
        <img
          src={overlay.imageDataUrl}
          alt="PDF overlay"
          style={{
            position: 'absolute',
            left: '50%',
            top: offsetTopPx,
            width: imgWidthPx,
            height: imgHeightPx,
            transform: 'translateX(-50%)',
            opacity: 0.9,
            imageRendering: 'auto',
            userSelect: 'none',
            pointerEvents: 'none',
          }}
          draggable={false}
        />
      </div>
      {visibleDepthSpan <= 0 && null}
    </div>
  );
}
