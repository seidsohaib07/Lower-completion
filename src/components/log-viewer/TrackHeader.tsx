import type { TrackConfig } from '../../types';
import { CURVE_DEFAULTS } from '../../constants';

interface TrackHeaderProps {
  trackConfig: TrackConfig;
}

export function TrackHeader({ trackConfig }: TrackHeaderProps) {
  const curveName = trackConfig.curveNames[0] ?? '';
  const defaults = CURVE_DEFAULTS[curveName];
  const unit = defaults?.unit ?? '';
  const scaleLabel = trackConfig.scaleType === 'logarithmic'
    ? `${trackConfig.scaleMin} - ${trackConfig.scaleMax}`
    : `${trackConfig.scaleMin} - ${trackConfig.scaleMax}`;

  return (
    <div
      className="flex flex-col items-center justify-center h-10 border-b border-[#1e293b] px-1 select-none shrink-0"
      style={{ borderLeft: `2px solid ${trackConfig.color}` }}
    >
      <span className="text-[10px] font-semibold" style={{ color: trackConfig.color }}>
        {curveName}
      </span>
      <span className="text-[8px] text-[#64748b]">
        {scaleLabel} {unit}
      </span>
    </div>
  );
}
