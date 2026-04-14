import { useCompletionStore } from '../../stores';
import { EQUIPMENT_COLORS, EQUIPMENT_LABELS } from '../../constants';
import type { EquipmentType } from '../../types';

export function CompletionLegend() {
  const items = useCompletionStore((s) => s.completionString.items);

  // Count occurrences of each equipment type. Blank pipes collapse into one entry.
  const counts = new Map<EquipmentType, number>();
  for (const item of items) {
    counts.set(item.type, (counts.get(item.type) ?? 0) + 1);
  }

  const entries = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);

  return (
    <div
      className="flex items-center gap-3 px-3 h-7 border-t shrink-0 overflow-x-auto"
      style={{
        background: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
      }}
    >
      {entries.length === 0 && (
        <span className="text-[9px]" style={{ color: 'var(--color-text-muted)' }}>
          No equipment placed yet
        </span>
      )}
      {entries.map(([type, count]) => (
        <div key={type} className="flex items-center gap-1 shrink-0">
          <div
            className="w-3 h-3 rounded-sm"
            style={{
              backgroundColor: EQUIPMENT_COLORS[type] + '60',
              border: `1px solid ${EQUIPMENT_COLORS[type]}`,
            }}
          />
          <span className="text-[9px]" style={{ color: 'var(--color-text)' }}>
            {count}× {EQUIPMENT_LABELS[type]}
          </span>
        </div>
      ))}
    </div>
  );
}
