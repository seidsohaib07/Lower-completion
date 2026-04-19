import type { TrackConfig } from '../../types';
import { CURVE_DEFAULTS } from '../../constants';

interface TrackHeaderProps {
  trackConfig: TrackConfig;
  compact?: boolean;
}

export function TrackHeader({ trackConfig, compact }: TrackHeaderProps) {
  const curveName = trackConfig.curveNames[0] ?? '';
  const defaults = CURVE_DEFAULTS[curveName];
  const unit = defaults?.unit ?? '';
  const scaleLabel = trackConfig.scaleType === 'logarithmic'
    ? `${trackConfig.scaleMin} - ${trackConfig.scaleMax}`
    : `${trackConfig.scaleMin} - ${trackConfig.scaleMax}`;

  return (
    <div
      className="flex flex-col items-center justify-center border-b border-[#1e293b] px-0.5 select-none shrink-0 overflow-hidden"
      style={{
        borderLeft: `2px solid ${trackConfig.color}`,
        height: compact ? 24 : 40,
      }}
    >
      <span
        className="font-semibold truncate w-full text-center"
        style={{ color: trackConfig.color, fontSize: compact ? '8px' : '10px' }}
      >
        {curveName}
      </span>
      {!compact && (
        <span className="text-[8px] text-[#64748b] truncate w-full text-center">
          {scaleLabel} {unit}
        </span>
      )}
    </div>
  );
}
