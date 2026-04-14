import * as XLSX from 'xlsx';
import type { CompletionTally } from '../types';

/**
 * Export a completion tally to an Excel file.
 */
export function exportTallyToExcel(tally: CompletionTally) {
  const wb = XLSX.utils.book_new();

  // Header rows
  const headerData = [
    ['Completion Tally'],
    [`Well: ${tally.wellName}`],
    [`Date: ${tally.date}`],
    [`Prepared By: ${tally.preparedBy || 'Complete It'}`],
    [],
    ['#', 'Type', 'Description', 'Top MD (m)', 'Bottom MD (m)', 'Length (m)', 'Cum. Length (m)', 'OD (in)', 'ID (in)', 'Comment'],
  ];

  // Data rows
  const dataRows = tally.rows.map((row) => [
    row.sequence,
    row.equipmentType.replace('_', ' '),
    row.description,
    row.topMD,
    row.bottomMD,
    row.length,
    row.cumulativeLength,
    row.od,
    row.innerDiameter,
    row.comment ?? '',
  ]);

  // Summary row
  const summaryRows = [
    [],
    ['', '', 'TOTAL', '', '', tally.totalLength, '', '', '', ''],
  ];

  const allRows = [...headerData, ...dataRows, ...summaryRows];
  const ws = XLSX.utils.aoa_to_sheet(allRows);

  // Column widths
  ws['!cols'] = [
    { wch: 5 },   // #
    { wch: 14 },  // Type
    { wch: 30 },  // Description
    { wch: 12 },  // Top MD
    { wch: 12 },  // Bottom MD
    { wch: 10 },  // Length
    { wch: 12 },  // Cum Length
    { wch: 8 },   // OD
    { wch: 8 },   // ID
    { wch: 20 },  // Comment
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Tally');
  XLSX.writeFile(wb, `${tally.wellName}_tally.xlsx`);
}
