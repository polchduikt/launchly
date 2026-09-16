import React, { useState } from 'react';
import { TrendingUp } from 'lucide-react';
import { useTranslation, getLanguage } from '../../../../i18n/config';
import type { UserGrowthPoint } from '../../../../api/admin';

interface MetricConfig {
  key: string;
  label: string;
  color: string;
  valueKey: keyof Omit<UserGrowthPoint, 'date'>;
}

interface TrendChartWidgetProps {
  userGrowth: UserGrowthPoint[] | undefined;
  isManager: boolean;
}

export const TrendChartWidget: React.FC<TrendChartWidgetProps> = ({ userGrowth = [], isManager }) => {
  const { t } = useTranslation();
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const [visibleMetrics, setVisibleMetrics] = useState<Record<string, boolean>>({
    owners: true,
    activeOwners: true,
    clients: true,
    bots: true,
    automations: true,
    messages: true,
  });

  const metricConfigs: MetricConfig[] = [
    { key: 'owners', label: t('admin.site_owners') || 'Власники', color: '#6366f1', valueKey: 'registeredCount' },
    { key: 'activeOwners', label: t('admin.active_owners') || 'Активні Власники', color: '#10b981', valueKey: 'activeCount' },
    { key: 'clients', label: t('admin.bot_clients') || 'Клієнти', color: '#0ea5e9', valueKey: 'clientsCount' },
    { key: 'bots', label: t('admin.active_bots') || 'Активні Боти', color: '#a855f7', valueKey: 'botsCount' },
    { key: 'automations', label: t('admin.total_automations') || 'Автоматизації', color: '#f59e0b', valueKey: 'automationsCount' },
    { key: 'messages', label: t('admin.messages_sent') || 'Повідомлень', color: '#ec4899', valueKey: 'messagesCount' },
  ];

  const formatDateLabel = (dateStr: string) => {
    try {
      const date = new Date(dateStr.includes('T') ? dateStr : `${dateStr}T19:00:00`);
      if (isNaN(date.getTime())) return dateStr;
      const locale = getLanguage() === 'uk' ? 'uk-UA' : 'en-US';
      return date.toLocaleString(locale, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: getLanguage() !== 'uk',
      });
    } catch {
      return dateStr;
    }
  };

  const renderTrendChart = () => {
    if (userGrowth.length === 0) return null;

    const width = 1000;
    const height = 220;
    const padding = 35;

    const activeConfigs = metricConfigs.filter(cfg => visibleMetrics[cfg.key]);

    const maxVal = Math.max(
      ...userGrowth.map((g: UserGrowthPoint) => {
        const vals = activeConfigs.map(cfg => g[cfg.valueKey] || 0);
        return vals.length > 0 ? Math.max(...vals, 5) : 5;
      })
    );

    const getX = (index: number) => {
      if (userGrowth.length <= 1) return padding + (width - padding * 2) / 2;
      return padding + (index / (userGrowth.length - 1)) * (width - padding * 2);
    };

    const getY = (val: number) => {
      return height - padding - (val / maxVal) * (height - padding * 2);
    };

    const handleMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
      const svg = e.currentTarget;
      const rect = svg.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const svgX = (mouseX / rect.width) * width;

      let closestIdx = 0;
      let minDiff = Infinity;
      for (let i = 0; i < userGrowth.length; i++) {
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

    const paths = metricConfigs.map(cfg => {
      let linePath = '';
      let fillPath = '';

      if (!visibleMetrics[cfg.key]) return { linePath, fillPath, cfg };

      userGrowth.forEach((d: UserGrowthPoint, idx: number) => {
        const x = getX(idx);
        const val = d[cfg.valueKey] ?? 0;
        const y = getY(val);

        if (idx === 0) {
          linePath = `M ${x} ${y}`;
          fillPath = `M ${x} ${height - padding} L ${x} ${y}`;
        } else {
          const prevX = getX(idx - 1);
          const cpX1 = prevX + (x - prevX) / 2;
          const cpX2 = cpX1;
          const prevVal = userGrowth[idx - 1][cfg.valueKey] ?? 0;
          const prevY = getY(prevVal);

          linePath += ` C ${cpX1} ${prevY}, ${cpX2} ${y}, ${x} ${y}`;
          fillPath += ` C ${cpX1} ${prevY}, ${cpX2} ${y}, ${x} ${y}`;
        }

        if (idx === userGrowth.length - 1) {
          fillPath += ` L ${x} ${height - padding} Z`;
        }
      });

      return { linePath, fillPath, cfg };
    });

    return (
      <div className="w-full overflow-x-auto relative select-none">
        <svg
          className="w-full min-w-[650px] overflow-visible"
          viewBox={`0 0 ${width} ${height}`}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <defs>
            {metricConfigs.map(cfg => (
              <React.Fragment key={cfg.key}>
                <linearGradient id={`grad-${cfg.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={cfg.color} stopOpacity="0.2" />
                  <stop offset="100%" stopColor={cfg.color} stopOpacity="0.0" />
                </linearGradient>
                <filter id={`shadow-${cfg.key}`} x="-5%" y="-5%" width="110%" height="110%">
                  <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor={cfg.color} floodOpacity="0.2" />
                </filter>
              </React.Fragment>
            ))}
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
                  stroke="#e2e8f0"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
                <text
                  x={padding - 10}
                  y={y + 4}
                  fill="#94a3b8"
                  fontSize="10"
                  fontWeight="bold"
                  textAnchor="end"
                >
                  {valLabel}
                </text>
              </g>
            );
          })}

          {paths.map(p => p.fillPath && (
            <path key={`fill-${p.cfg.key}`} d={p.fillPath} fill={`url(#grad-${p.cfg.key})`} />
          ))}

          {paths.map(p => p.linePath && (
            <path
              key={`line-${p.cfg.key}`}
              d={p.linePath}
              fill="none"
              stroke={p.cfg.color}
              strokeWidth="2.5"
              strokeLinecap="round"
              filter={`url(#shadow-${p.cfg.key})`}
            />
          ))}

          {hoveredIdx !== null && (
            <line
              x1={getX(hoveredIdx)}
              y1={padding}
              x2={getX(hoveredIdx)}
              y2={height - padding}
              stroke="#94a3b8"
              strokeWidth="1.5"
              strokeDasharray="3 3"
            />
          )}

          {userGrowth.map((d: UserGrowthPoint, idx: number) => {
            const x = getX(idx);
            const isHovered = idx === hoveredIdx;

            return (
              <g key={idx}>
                {activeConfigs.map(cfg => {
                  const val = d[cfg.valueKey] ?? 0;
                  const y = getY(val);
                  return (
                    <circle
                      key={`${cfg.key}-${idx}`}
                      cx={x}
                      cy={y}
                      r={isHovered ? '4' : '2.5'}
                      fill={isHovered ? cfg.color : '#ffffff'}
                      stroke={cfg.color}
                      strokeWidth={isHovered ? '2' : '1.5'}
                      style={{ transition: 'all 0.12s ease-out' }}
                    />
                  );
                })}
              </g>
            );
          })}

          {userGrowth.map((d, idx) => {
            const x = getX(idx);
            const skipCount = Math.ceil(userGrowth.length / 7);
            const shouldShow = idx === 0 || idx === userGrowth.length - 1 || idx % skipCount === 0;
            if (!shouldShow) return null;

            return (
              <text
                key={idx}
                x={x}
                y={height - 10}
                fill="#64748b"
                fontSize="10"
                fontWeight="bold"
                textAnchor="middle"
              >
                {formatDateLabel(d.date)}
              </text>
            );
          })}
        </svg>

        {hoveredIdx !== null && userGrowth[hoveredIdx] && (
          <div
            className="absolute bg-slate-900/95 text-white px-3.5 py-2.5 rounded-2xl shadow-xl pointer-events-none text-left z-30 flex flex-col gap-1.5 min-w-[190px] border border-slate-800 animate-fade-in"
            style={(() => {
              const xPercent = (getX(hoveredIdx) / width) * 100;
              if (xPercent < 20) {
                return {
                  left: `${xPercent}%`,
                  top: '10%',
                  transform: 'translateX(10px)',
                  transition: 'left 0.12s ease-out',
                };
              } else if (xPercent > 80) {
                return {
                  right: `${100 - xPercent}%`,
                  top: '10%',
                  transform: 'translateX(-10px)',
                  transition: 'right 0.12s ease-out',
                };
              } else {
                return {
                  left: `${xPercent}%`,
                  top: '10%',
                  transform: 'translateX(-50%)',
                  transition: 'left 0.12s ease-out',
                };
              }
            })()}
          >
            <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider select-none border-b border-slate-800 pb-1">
              {formatDateLabel(userGrowth[hoveredIdx].date)}
            </div>
            {activeConfigs.map(cfg => (
              <div key={`tooltip-${cfg.key}`} className="flex items-center justify-between gap-4 text-xs select-none">
                <span className="flex items-center gap-1.5 font-bold text-slate-300">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cfg.color }}></span>
                  {cfg.label}
                </span>
                <span className="font-extrabold text-white">
                  {hoveredIdx !== null && userGrowth[hoveredIdx] ? userGrowth[hoveredIdx][cfg.valueKey] ?? 0 : 0}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`${isManager ? 'lg:col-span-4' : 'lg:col-span-3'} bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-3xl p-6 shadow-[4px_4px_0px_#0A0A0A] text-[#0A0A0A]`}>
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-6">
        <h3 className="font-['Anybody',sans-serif] text-base font-black uppercase text-[#0A0A0A] flex items-center gap-2 shrink-0">
          <TrendingUp size={18} className="text-[#0A0A0A]" />
          <span>{t('admin.registration_trend')}</span>
        </h3>

        <div className="flex flex-wrap items-center gap-3 text-xs font-bold select-none">
          {metricConfigs.map(cfg => {
            const isActive = visibleMetrics[cfg.key];
            return (
              <button
                key={cfg.key}
                onClick={() => setVisibleMetrics(prev => ({ ...prev, [cfg.key]: !prev[cfg.key] }))}
                className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg border-2 border-[#0A0A0A] transition-all cursor-pointer ${isActive ? 'bg-white text-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A]' : 'bg-transparent text-slate-500 opacity-60 hover:opacity-100'}`}
              >
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cfg.color }}></span>
                <span className={isActive ? 'font-black' : 'line-through'}>{cfg.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {renderTrendChart()}
    </div>
  );
};
