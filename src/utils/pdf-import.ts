import type { LogDataSet, LogCurve } from '../types';
import type { PdfOverlay } from '../stores/log-data-store';

/**
 * Dynamically loads pdf.js. We configure the worker to a CDN-hosted build that matches
 * the version installed in node_modules. This keeps bundle size manageable.
 */
async function loadPdfJs() {
  const pdfjs = await import('pdfjs-dist');
  // Worker: use the module worker shipped with pdfjs-dist
  // Vite resolves the ?url suffix to a URL string.
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const workerSrc = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
  return pdfjs;
}

/**
 * Render the first page of a PDF to a PNG data URL. Returns the overlay metadata
 * including user-supplied depth calibration.
 */
export async function importPDFAsOverlay(
  file: File,
  topMD: number,
  bottomMD: number
): Promise<PdfOverlay> {
  const pdfjs = await loadPdfJs();
  const buf = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: buf }).promise;
  const page = await doc.getPage(1);
  const viewport = page.getViewport({ scale: 2 });

  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not obtain 2D context');

  await page.render({ canvasContext: ctx, viewport, canvas }).promise;

  const imageDataUrl = canvas.toDataURL('image/png');
  return {
    imageDataUrl,
    topMD,
    bottomMD,
    widthPx: viewport.width,
    heightPx: viewport.height,
  };
}

/**
 * Attempt to parse a PDF as a textual CPI log. Looks for depth + curve columns.
 * This is a best-effort heuristic; many CPI PDFs are raster-only and will return null.
 */
export async function extractCPIFromPDF(file: File): Promise<LogDataSet | null> {
  const pdfjs = await loadPdfJs();
  const buf = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: buf }).promise;

  const allRows: number[][] = [];
  let headerNames: string[] | null = null;

  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    // Group text items by y-coordinate (rounded) to reconstruct rows
    const rows = new Map<number, Array<{ x: number; str: string }>>();
    for (const item of content.items as Array<{ str: string; transform: number[] }>) {
      const y = Math.round(item.transform[5]);
      const x = item.transform[4];
      if (!rows.has(y)) rows.set(y, []);
      rows.get(y)!.push({ x, str: item.str.trim() });
    }

    const sortedY = [...rows.keys()].sort((a, b) => b - a); // top-to-bottom
    for (const y of sortedY) {
      const row = rows.get(y)!.sort((a, b) => a.x - b.x);
      const cells = row.map((r) => r.str).filter((s) => s.length > 0);
      if (cells.length < 2) continue;

      if (!headerNames) {
        // Detect header row: mostly non-numeric tokens
        const nonNum = cells.filter((c) => isNaN(parseFloat(c))).length;
        if (nonNum >= Math.max(2, cells.length - 1)) {
          headerNames = cells.map((c) => c.toUpperCase().replace(/[^A-Z0-9_]/g, ''));
          continue;
        }
      }

      const numbers = cells.map((c) => parseFloat(c));
      if (numbers.every((n) => !isNaN(n)) && numbers.length >= 2) {
        allRows.push(numbers);
      }
    }
  }

  if (!headerNames || allRows.length < 5) return null;

  // First column assumed to be MD/depth
  const depthIdx = headerNames.findIndex((h) => /^(MD|DEPTH|TVD)/.test(h));
  const dIdx = depthIdx >= 0 ? depthIdx : 0;

  const depthCurve: number[] = [];
  const curveArrays: number[][] = headerNames.map(() => []);
  for (const row of allRows) {
    if (row.length <= dIdx) continue;
    const md = row[dIdx];
    if (!isFinite(md)) continue;
    depthCurve.push(md);
    for (let i = 0; i < headerNames.length; i++) {
      curveArrays[i].push(i < row.length ? row[i] : -999.25);
    }
  }
  if (depthCurve.length < 5) return null;

  const curves: LogCurve[] = headerNames
    .map((name, i) => ({
      name: name || `C${i}`,
      unit: '',
      description: name,
      data: curveArrays[i],
      nullValue: -999.25,
    }))
    .filter((_, i) => i !== dIdx);

  const minDepth = Math.min(...depthCurve);
  const maxDepth = Math.max(...depthCurve);
  const steps: number[] = [];
  for (let i = 1; i < depthCurve.length; i++) steps.push(Math.abs(depthCurve[i] - depthCurve[i - 1]));
  const depthStep = steps.length ? steps.reduce((a, b) => a + b, 0) / steps.length : 0.15;

  return {
    wellName: file.name.replace(/\.pdf$/i, ''),
    depthCurve,
    depthUnit: 'm',
    curves,
    depthStep,
    minDepth,
    maxDepth,
  };
}
