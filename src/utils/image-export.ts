import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';

function getExportBackground(): string {
  const isLight = document.documentElement.getAttribute('data-theme') === 'light';
  return isLight ? '#ffffff' : '#0f172a';
}

/**
 * Find the element that should be captured. Prefers a [data-export-region]
 * (logs + schematic only, without the toolbox) and falls back to the
 * legacy [data-export-area] for backwards compatibility.
 */
function findExportTarget(): HTMLElement | null {
  return (
    (document.querySelector('[data-export-region]') as HTMLElement | null) ??
    (document.querySelector('[data-export-area]') as HTMLElement | null)
  );
}

/**
 * Export the schematic area (logs + schematic) as a PNG image.
 * The toolbox and properties panel are excluded.
 */
export async function exportSchematicImage() {
  const exportArea = findExportTarget();
  if (!exportArea) {
    alert('No schematic area found to export');
    return;
  }

  try {
    const dataUrl = await toPng(exportArea, {
      backgroundColor: getExportBackground(),
      pixelRatio: 2,
      filter: (node) => {
        // Strip anything explicitly marked as not-for-export.
        if (!(node instanceof HTMLElement)) return true;
        if (node.hasAttribute('data-no-export')) return false;
        return true;
      },
    });

    const link = document.createElement('a');
    link.download = `completion_schematic_${new Date().toISOString().split('T')[0]}.png`;
    link.href = dataUrl;
    link.click();
  } catch (err) {
    console.error('Failed to export PNG:', err);
    alert('Failed to export image.');
  }
}

/**
 * Export the schematic area as a PDF document.
 */
export async function exportSchematicPDF() {
  const exportArea = findExportTarget();
  if (!exportArea) {
    alert('No schematic area found to export');
    return;
  }

  try {
    const dataUrl = await toPng(exportArea, {
      backgroundColor: getExportBackground(),
      pixelRatio: 2,
      filter: (node) => {
        if (!(node instanceof HTMLElement)) return true;
        if (node.hasAttribute('data-no-export')) return false;
        return true;
      },
    });

    const img = new Image();
    img.src = dataUrl;
    await new Promise<void>((resolve) => {
      img.onload = () => resolve();
    });

    // Determine orientation based on aspect ratio
    const aspectRatio = img.width / img.height;
    const isLandscape = aspectRatio > 1;

    const pdf = new jsPDF({
      orientation: isLandscape ? 'landscape' : 'portrait',
      unit: 'mm',
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const availableWidth = pageWidth - margin * 2;
    const availableHeight = pageHeight - margin * 2 - 15;

    pdf.setFontSize(12);
    pdf.text('Complete It — Lower Completion Schematic', margin, margin + 5);
    pdf.setFontSize(8);
    pdf.text(`Date: ${new Date().toLocaleDateString()}`, margin, margin + 11);

    const scale = Math.min(availableWidth / img.width, availableHeight / img.height);
    const imgWidth = img.width * scale;
    const imgHeight = img.height * scale;
    const imgX = margin + (availableWidth - imgWidth) / 2;
    const imgY = margin + 15;

    pdf.addImage(dataUrl, 'PNG', imgX, imgY, imgWidth, imgHeight);

    pdf.save(`completion_schematic_${new Date().toISOString().split('T')[0]}.pdf`);
  } catch (err) {
    console.error('Failed to export PDF:', err);
    alert('Failed to export PDF.');
  }
}
