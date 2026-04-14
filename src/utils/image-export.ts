import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';

/**
 * Export the schematic area as a PNG image.
 */
export async function exportSchematicImage() {
  const exportArea = document.querySelector('[data-export-area]') as HTMLElement;
  if (!exportArea) {
    alert('No schematic area found to export');
    return;
  }

  try {
    const dataUrl = await toPng(exportArea, {
      backgroundColor: '#111827',
      pixelRatio: 2,
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
  const exportArea = document.querySelector('[data-export-area]') as HTMLElement;
  if (!exportArea) {
    alert('No schematic area found to export');
    return;
  }

  try {
    const dataUrl = await toPng(exportArea, {
      backgroundColor: '#111827',
      pixelRatio: 2,
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
    const availableHeight = pageHeight - margin * 2 - 15; // Reserve space for header

    // Header
    pdf.setFontSize(12);
    pdf.text('Complete It - Lower Completion Schematic', margin, margin + 5);
    pdf.setFontSize(8);
    pdf.text(`Date: ${new Date().toLocaleDateString()}`, margin, margin + 11);

    // Scale image to fit
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
