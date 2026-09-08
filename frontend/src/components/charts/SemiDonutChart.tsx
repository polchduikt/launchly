import React from 'react';
import { CHART_DIMENSIONS } from '../../const/constants';

export interface SemiDonutChartItem {
  name: string;
  count: number;
  pct: number;
  color: string;
}

export interface SemiDonutChartProps {
  data: SemiDonutChartItem[];
  total: number;
}

export const SemiDonutChart: React.FC<SemiDonutChartProps> = ({ data, total }) => {
  const { SIZE, STROKE_WIDTH, GAP_DEG, START_OFFSET_DEG } = CHART_DIMENSIONS.SEMI_DONUT;
  const r = (SIZE - STROKE_WIDTH) / 2;
  const circumference = 2 * Math.PI * r;
  const cx = SIZE / 2;
  const cy = SIZE / 2;
  const totalCounts = data.reduce((sum, item) => sum + item.count, 0);

  let cumulativeOffset = 0;
  const startOffset = circumference * (START_OFFSET_DEG / 360);

  return (
    <div className="relative flex items-center justify-center" style={{ width: SIZE, height: SIZE }}>
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} style={{ transform: 'rotate(-90deg)' }} aria-hidden="true">
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={STROKE_WIDTH}
        />
        {data.map((item, idx) => {
          const fraction = totalCounts > 0 ? item.count / totalCounts : 0;
          const gapFraction = (GAP_DEG / 360) * circumference;
          const segLength = fraction * circumference - gapFraction;
          const dashArray = `${Math.max(segLength, 0)} ${circumference - Math.max(segLength, 0)}`;
          const dashOffset = -(cumulativeOffset - startOffset);
          cumulativeOffset += fraction * circumference;

          return (
            <circle
              key={idx}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={item.color}
              strokeWidth={STROKE_WIDTH}
              strokeDasharray={dashArray}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none font-['JetBrains_Mono',monospace]">
        <span className="text-[8px] font-extrabold text-[#0A0A0A]/60 uppercase tracking-widest block">Total</span>
        <span className="text-sm font-black text-[#0A0A0A] tracking-tight block mt-0.5">
          {total.toLocaleString()}
        </span>
      </div>
    </div>
  );
};
