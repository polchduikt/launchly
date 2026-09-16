import React from 'react';
import { CHART_DIMENSIONS } from '../../const/constants';

export interface MiniBarChartProps {
  data: number[];
  color: string;
}

export const MiniBarChart: React.FC<MiniBarChartProps> = ({ data, color }) => {
  const maxVal = Math.max(...data, 1);
  const { WIDTH, HEIGHT, GAP, MIN_BAR_HEIGHT } = CHART_DIMENSIONS.MINI_BAR;
  const barWidth = (WIDTH - GAP * (data.length - 1)) / data.length;

  return (
    <svg width={WIDTH} height={HEIGHT} className="overflow-visible" aria-hidden="true">
      {data.map((val, idx) => {
        const barHeight = Math.max((val / maxVal) * HEIGHT, MIN_BAR_HEIGHT);
        const x = idx * (barWidth + GAP);
        const y = HEIGHT - barHeight;
        return (
          <rect
            key={idx}
            x={x}
            y={y}
            width={barWidth}
            height={barHeight}
            fill={color}
            rx={1.5}
            className="transition-all duration-300 opacity-80 hover:opacity-100"
          />
        );
      })}
    </svg>
  );
};
