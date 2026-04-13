import { useMemo } from 'react';
import { useCompletionStore, useSelectionStore } from '../../stores';
import { generateTally } from '../../utils/tally-calculator';
import { EQUIPMENT_COLORS } from '../../constants';

export function TallyTable() {
  const completionString = useCompletionStore((s) => s.completionString);
  const selectEquipment = useSelectionStore((s) => s.selectEquipment);

  const tally = useMemo(
    () => generateTally(completionString.items, completionString.wellName),
    [completionString]
  );

  return (
    <div className="flex flex-col h-full bg-[#0f172a]">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#1e293b] shrink-0">
        <span className="text-[10px] text-[#64748b] uppercase tracking-wider font-semibold">
          Completion Tally
        </span>
        <span className="text-[10px] text-[#475569]">
          {tally.rows.length} items | Total: {tally.totalLength.toFixed(2)} m
        </span>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full text-[10px]">
          <thead className="sticky top-0 bg-[#0f172a]">
            <tr className="text-[#64748b] uppercase">
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
                className="border-t border-[#1e293b] hover:bg-[#1e293b] cursor-pointer transition-colors"
                onClick={() => selectEquipment(row.equipmentId)}
              >
                <td className="px-2 py-0.5 text-[#475569]">{row.sequence}</td>
                <td className="px-2 py-0.5">
                  <span
                    className="inline-block w-2 h-2 rounded-sm mr-1"
                    style={{ backgroundColor: EQUIPMENT_COLORS[row.equipmentType] }}
                  />
                  <span className="text-[#94a3b8]">{row.equipmentType.replace('_', ' ')}</span>
                </td>
                <td className="px-2 py-0.5 text-[#e2e8f0]">{row.description}</td>
                <td className="px-2 py-0.5 text-right text-[#e2e8f0]">{row.topMD.toFixed(2)}</td>
                <td className="px-2 py-0.5 text-right text-[#e2e8f0]">{row.bottomMD.toFixed(2)}</td>
                <td className="px-2 py-0.5 text-right text-[#e2e8f0]">{row.length.toFixed(2)}</td>
                <td className="px-2 py-0.5 text-right text-[#94a3b8]">{row.cumulativeLength.toFixed(2)}</td>
                <td className="px-2 py-0.5 text-right text-[#e2e8f0]">{row.od}"</td>
                <td className="px-2 py-0.5 text-right text-[#e2e8f0]">{row.innerDiameter}"</td>
                <td className="px-2 py-0.5 text-[#475569]">{row.comment ?? ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
