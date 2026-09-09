import React, { useState } from 'react';
import { useTranslation } from '../../i18n/config';

export interface ActivityDataPoint {
  date: string;
  activeUsers: number;
  clicks: number;
}

export interface ActivityAreaChartProps {
  data: ActivityDataPoint[];
  isLoaded?: boolean;
}

export const ActivityAreaChart: React.FC<ActivityAreaChartProps> = ({ data, isLoaded = true }) => {
  const { t } = useTranslation();
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const width = 1000;
  const height = 170;
  const padding = 28;

  const maxVal = Math.max(
    ...data.map((d) => Math.max(d.activeUsers, d.clicks, 5)),
    5
  );

  const getX = (index: number) => {
    if (data.length <= 1) return padding + (width - padding * 2) / 2;
    return padding + (index / (data.length - 1)) * (width - padding * 2);
  };

  const getY = (val: number) => {
    return height - padding - (val / maxVal) * (height - padding * 2);
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    if (!isLoaded || data.length === 0) return;
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const svgX = (mouseX / rect.width) * width;

    let closestIdx = 0;
    let minDiff = Infinity;
    for (let i = 0; i < data.length; i++) {
      const diff = Math.abs(getX(i) - svgX);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = i;
      }
    }
    setHoveredIdx(closestIdx);
  };

  const handleMouseLeave = () => {
    setHoveredIdx(null);
  };

  let usersPath = '';
  let clicksPath = '';
  let usersFillPath = '';
  let clicksFillPath = '';

  data.forEach((d, idx) => {
    const x = getX(idx);
    const yUsers = getY(d.activeUsers);
    const yClicks = getY(d.clicks);

    if (idx === 0) {
      usersPath = `M ${x} ${yUsers}`;
      clicksPath = `M ${x} ${yClicks}`;
      usersFillPath = `M ${x} ${height - padding} L ${x} ${yUsers}`;
      clicksFillPath = `M ${x} ${height - padding} L ${x} ${yClicks}`;
    } else {
      const prevX = getX(idx - 1);
      const cpX1 = prevX + (x - prevX) / 2;
      const cpX2 = cpX1;
      const prevYUsers = getY(data[idx - 1].activeUsers);
      const prevYClicks = getY(data[idx - 1].clicks);

      usersPath += ` C ${cpX1} ${prevYUsers}, ${cpX2} ${yUsers}, ${x} ${yUsers}`;
      clicksPath += ` C ${cpX1} ${prevYClicks}, ${cpX2} ${yClicks}, ${x} ${yClicks}`;
      usersFillPath += ` C ${cpX1} ${prevYUsers}, ${cpX2} ${yUsers}, ${x} ${yUsers}`;
      clicksFillPath += ` C ${cpX1} ${prevYClicks}, ${cpX2} ${yClicks}, ${x} ${yClicks}`;
    }

    if (idx === data.length - 1) {
      usersFillPath += ` L ${x} ${height - padding} Z`;
      clicksFillPath += ` L ${x} ${height - padding} Z`;
    }
  });

  return (
    <div className="w-full overflow-x-auto relative">
      <svg
        className="w-full min-w-[650px] overflow-visible"
        viewBox={`0 0 ${width} ${height}`}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <defs>
          <linearGradient id="usersGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="clicksGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = padding + ratio * (height - padding * 2);
          const valLabel = Math.round(maxVal * (1 - ratio));
          return (
            <g key={ratio} className="opacity-40">
              <line
                x1={padding}
                y1={y}
                x2={width - padding}
                y2={y}
                stroke="#0A0A0A"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <text
                x={padding - 10}
                y={y + 4}
                fill="#0A0A0A"
                fontSize="9.5"
                fontWeight="bold"
                textAnchor="end"
                className="font-mono"
              >
                {valLabel}
              </text>
            </g>
          );
        })}

        <path d={usersFillPath} fill="url(#usersGradient)" />
        <path d={clicksFillPath} fill="url(#clicksGradient)" />

        <path
          d={usersPath}
          fill="none"
          stroke="#6366f1"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
        <path
          d={clicksPath}
          fill="none"
          stroke="#10b981"
          strokeWidth="3.2"
          strokeLinecap="round"
        />

        {hoveredIdx !== null && (
          <line
            x1={getX(hoveredIdx)}
            y1={padding}
            x2={getX(hoveredIdx)}
            y2={height - padding}
            stroke="#0A0A0A"
            strokeWidth="1.5"
            strokeDasharray="3 3"
          />
        )}

        {data.map((d, idx) => {
          const x = getX(idx);
          const yUsers = getY(d.activeUsers);
          const yClicks = getY(d.clicks);
          const isHovered = idx === hoveredIdx;

          if (!isHovered && data.length > 15) return null;

          return (
            <g key={idx}>
              <circle
                cx={x}
                cy={yUsers}
                r={isHovered ? '5.5' : '3.5'}
                fill={isHovered ? '#6366f1' : '#ffffff'}
                stroke="#6366f1"
                strokeWidth={isHovered ? '2.5' : '1.8'}
                style={{ transition: 'all 0.15s ease-out' }}
              />
              <circle
                cx={x}
                cy={yClicks}
                r={isHovered ? '5.5' : '3.5'}
                fill={isHovered ? '#10b981' : '#ffffff'}
                stroke="#10b981"
                strokeWidth={isHovered ? '2.5' : '1.8'}
                style={{ transition: 'all 0.15s ease-out' }}
              />
            </g>
          );
        })}

        {data.map((d, idx) => {
          if (idx % Math.ceil(data.length / 7) !== 0 && idx !== data.length - 1) return null;
          const x = getX(idx);
          const dateParts = d.date.split('-');
          const labelStr = dateParts.length >= 3 ? `${dateParts[2]}.${dateParts[1]}` : d.date;

          return (
            <text
              key={idx}
              x={x}
              y={height - 10}
              fill="#0A0A0A"
              fontSize="9.5"
              fontWeight="bold"
              textAnchor="middle"
              className="font-mono"
            >
              {labelStr}
            </text>
          );
        })}
      </svg>

      {hoveredIdx !== null && data[hoveredIdx] && (
        <div
          className="absolute bg-[#0A0A0A] text-[#F2EBDD] px-3.5 py-2.5 rounded-xl border-2 border-[#0A0A0A] pointer-events-none text-left z-30 flex flex-col gap-1 min-w-[160px] font-['JetBrains_Mono',monospace]"
          style={(() => {
            const xPercent = (getX(hoveredIdx) / width) * 100;
            if (xPercent < 20) {
              return {
                left: `${xPercent}%`,
                top: `8%`,
                transform: `translateX(10px)`,
                transition: 'left 0.12s ease-out',
              };
            } else if (xPercent > 80) {
              return {
                right: `${100 - xPercent}%`,
                top: `8%`,
                transform: `translateX(-10px)`,
                transition: 'right 0.12s ease-out',
              };
            } else {
              return {
                left: `${xPercent}%`,
                top: `8%`,
                transform: `translateX(-50%)`,
                transition: 'left 0.12s ease-out',
              };
            }
          })()}
        >
          <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider select-none">
            {(() => {
              const dateParts = data[hoveredIdx].date.split('-');
              return dateParts.length >= 3
                ? `${dateParts[2]}.${dateParts[1]}.${dateParts[0]}`
                : data[hoveredIdx].date;
            })()}
          </div>
          <div className="flex items-center justify-between gap-4 text-xs mt-1 select-none">
            <span className="flex items-center gap-1.5 font-semibold text-slate-300">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
              {t('dashboard.stats.active_users_legend')}
            </span>
            <span className="font-extrabold text-white">{data[hoveredIdx].activeUsers}</span>
          </div>
          <div className="flex items-center justify-between gap-4 text-xs select-none">
            <span className="flex items-center gap-1.5 font-semibold text-slate-300">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              {t('dashboard.stats.button_clicks_legend')}
            </span>
            <span className="font-extrabold text-white">{data[hoveredIdx].clicks}</span>
          </div>
        </div>
      )}
    </div>
  );
};
