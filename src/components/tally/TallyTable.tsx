import { useMemo } from 'react';
import { useCompletionStore, useSelectionStore } from '../../stores';
import { generateTally } from '../../utils/tally-calculator';
import { exportTallyToExcel } from '../../utils/excel-export';
import { EQUIPMENT_COLORS } from '../../constants';

export function TallyTable() {
  const completionString = useCompletionStore((s) => s.completionString);
  const selectEquipment = useSelectionStore((s) => s.selectEquipment);

  const tally = useMemo(
    () => generateTally(completionString.items, completionString.wellName),
    [completionString]
  );

  const handleExport = () => {
    exportTallyToExcel(tally);
  };

  const handleCopy = async () => {
    const headers = ['#', 'Type', 'Description', 'Top MD', 'Bottom MD', 'Length', 'Cum. Length', 'OD', 'ID', 'Comment'];
    const lines = [headers.join('\t')];
    for (const row of tally.rows) {
      lines.push(
        [
          row.sequence,
          row.equipmentType,
          row.description,
          row.topMD.toFixed(2),
          row.bottomMD.toFixed(2),
          row.length.toFixed(2),
          row.cumulativeLength.toFixed(2),
          row.od,
          row.innerDiameter,
          row.comment ?? '',
        ].join('\t')
      );
    }
    const text = lines.join('\n');
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback for insecure context
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
  };

  return (
    <div
      className="flex flex-col h-full"
      style={{ background: 'var(--color-surface)', color: 'var(--color-text)' }}
    >
      <div
        className="flex items-center justify-between px-3 py-1.5 border-b shrink-0"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <div className="flex items-center gap-2">
          <span
            className="text-[10px] uppercase tracking-wider font-semibold"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Completion Tally
          </span>
          <span
            className="text-[8px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full"
            style={{ background: 'var(--color-accent)', color: '#000' }}
          >
            &#946; Beta
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
            {tally.rows.length} items | Total: {tally.totalLength.toFixed(2)} m
          </span>
          <button
            onClick={handleCopy}
            disabled={tally.rows.length === 0}
            className="text-[10px] px-2 py-0.5 rounded border disabled:opacity-40"
            style={{
              background: 'var(--color-surface-light)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text)',
            }}
            title="Copy tally as TSV (paste in Excel)"
          >
            Copy
          </button>
          <button
            onClick={handleExport}
            disabled={tally.rows.length === 0}
            className="text-[10px] px-2 py-0.5 rounded border disabled:opacity-40"
            style={{
              background: 'var(--color-primary)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text)',
            }}
            title="Export tally as Excel .xlsx"
          >
            Export Excel
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full text-[10px]">
          <thead
            className="sticky top-0"
            style={{ background: 'var(--color-surface)' }}
          >
            <tr style={{ color: 'var(--color-text-muted)' }} className="uppercase">
              <th className="px-2 py-1 text-left font-medium">#</th>
              <th className="px-2 py-1 text-left font-medium">Type</th>
              <th className="px-2 py-1 text-left font-medium">Description</th>
              <th className="px-2 py-1 text-right font-medium">Top MD</th>
              <th className="px-2 py-1 text-right font-medium">Bottom MD</th>
              <th className="px-2 py-1 text-right font-medium">Length</th>
              <th className="px-2 py-1 text-right font-medium">Cum. Length</th>
              <th className="px-2 py-1 text-right font-medium">OD</th>
              <th className="px-2 py-1 text-right font-medium">ID</th>
              <th className="px-2 py-1 text-left font-medium">Comment</th>
            </tr>
          </thead>
          <tbody>
            {tally.rows.map((row) => (
              <tr
                key={`${row.sequence}-${row.topMD}`}
                className="border-t cursor-pointer transition-colors hover:bg-[rgba(148,163,184,0.12)]"
                style={{ borderColor: 'var(--color-border)' }}
                onClick={() => selectEquipment(row.equipmentId)}
              >
                <td className="px-2 py-0.5" style={{ color: 'var(--color-text-muted)' }}>{row.sequence}</td>
                <td className="px-2 py-0.5">
                  <span
                    className="inline-block w-2 h-2 rounded-sm mr-1 align-middle"
                    style={{ backgroundColor: EQUIPMENT_COLORS[row.equipmentType] }}
                  />
                  <span style={{ color: 'var(--color-text)' }}>{row.equipmentType.replace('_', ' ')}</span>
                </td>
                <td className="px-2 py-0.5" style={{ color: 'var(--color-text)' }}>{row.description}</td>
                <td className="px-2 py-0.5 text-right" style={{ color: 'var(--color-text)' }}>{row.topMD.toFixed(2)}</td>
                <td className="px-2 py-0.5 text-right" style={{ color: 'var(--color-text)' }}>{row.bottomMD.toFixed(2)}</td>
                <td className="px-2 py-0.5 text-right" style={{ color: 'var(--color-text)' }}>{row.length.toFixed(2)}</td>
                <td className="px-2 py-0.5 text-right" style={{ color: 'var(--color-text-muted)' }}>{row.cumulativeLength.toFixed(2)}</td>
                <td className="px-2 py-0.5 text-right" style={{ color: 'var(--color-text)' }}>{row.od}"</td>
                <td className="px-2 py-0.5 text-right" style={{ color: 'var(--color-text)' }}>{row.innerDiameter}"</td>
                <td className="px-2 py-0.5" style={{ color: 'var(--color-text-muted)' }}>{row.comment ?? ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
