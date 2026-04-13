import { useRef } from 'react';
import { useSynchronizedScroll } from '../../hooks/use-synchronized-scroll';
import { useCompletionStore } from '../../stores';
import { CompletionCanvas } from './CompletionCanvas';
import { CompletionLegend } from './CompletionLegend';

export function CompletionViewer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const items = useCompletionStore((s) => s.completionString.items);

  useSynchronizedScroll(containerRef);

  if (items.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-[#64748b] text-sm">
        <div className="text-center">
          <p className="text-lg mb-1">No Completion String</p>
          <p className="text-xs">Import CPI logs to auto-generate blank pipe</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-center h-10 border-b border-[#1e293b] shrink-0">
        <span className="text-[10px] text-[#64748b] font-semibold uppercase tracking-wider">
          Completion Schematic
        </span>
      </div>

      {/* Canvas */}
      <CompletionCanvas />

      {/* Legend */}
      <CompletionLegend />
    </div>
  );
}
