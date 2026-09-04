import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../../components/layout/DashboardLayout';
import { useDashboardStatsQuery } from '../../../hooks/dashboard/useDashboardStatsQuery';
import { useBotsQuery } from '../../../hooks/bot/useBotsQuery';
import { useTranslation } from '../../../i18n/config';
import { 
  Loader2, 
  AlertCircle, 
  TrendingUp, 
  TrendingDown, 
  ChevronDown,
  MessageSquare,
  Clock,
  Bot,
  HelpCircle,
  MoreVertical,
  Plus
} from 'lucide-react';
import { AiIcon } from '../../../components/ui/AiIcon';

interface MiniBarChartProps {
  data: number[];
  color: string;
}

const MiniBarChart: React.FC<MiniBarChartProps> = ({ data, color }) => {
  const maxVal = Math.max(...data, 1);
  const width = 100;
  const height = 24;
  const gap = 3;
  const barWidth = (width - gap * (data.length - 1)) / data.length;

  return (
    <svg width={width} height={height} className="overflow-visible">
      {data.map((val, idx) => {
        const barHeight = Math.max((val / maxVal) * height, 2);
        const x = idx * (barWidth + gap);
        const y = height - barHeight;
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

interface SemiDonutChartProps {
  data: { name: string; count: number; pct: number; color: string }[];
  total: number;
}

const SemiDonutChart: React.FC<SemiDonutChartProps> = ({ data, total }) => {
  const size = 85;
  const strokeWidth = 10.5;
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const cx = size / 2;
  const cy = size / 2;
  const gapDeg = 2;
  const totalCounts = data.reduce((sum, item) => sum + item.count, 0);

  let cumulativeOffset = 0;
  const startOffset = circumference * (90 / 360);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={strokeWidth}
        />
        {data.map((item, idx) => {
          const fraction = totalCounts > 0 ? item.count / totalCounts : 0;
          const gapFraction = (gapDeg / 360) * circumference;
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
              strokeWidth={strokeWidth}
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

export const DashboardStatsPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [selectedBotId, setSelectedBotId] = useState<number>(0);
  const [days, setDays] = useState<number>(7);
  const [isBotSelectorOpen, setIsBotSelectorOpen] = useState(false);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const { data: bots = [] } = useBotsQuery();
  const { data: stats, isLoading, error } = useDashboardStatsQuery(selectedBotId, days, true);
  const connectedBots = React.useMemo(() => bots.filter((b) => b.hasTelegramToken), [bots]);

  const botSelectorRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (botSelectorRef.current && !botSelectorRef.current.contains(e.target as Node)) {
        setIsBotSelectorOpen(false);
      }
    };
    if (isBotSelectorOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isBotSelectorOpen]);

  React.useEffect(() => {
    if (connectedBots.length === 1 && selectedBotId === 0) {
      setSelectedBotId(connectedBots[0].id);
    }
  }, [connectedBots, selectedBotId]);

  const tagStats = React.useMemo(() => {
    if (stats?.topTags && stats.topTags.length > 0) {
      return stats.topTags.map((t) => ({ name: t.tagName, count: t.count }));
    }
    return [];
  }, [stats]);

  const aiStats = React.useMemo(() => {
    if (stats) {
      return {
        messagesProcessed: stats.aiMessagesProcessed,
        resolutionRate: stats.aiResolutionRate,
        timeSavedHours: stats.aiTimeSavedHours,
        responseTimeSeconds: stats.aiResponseTimeSeconds
      };
    }
    return {
      messagesProcessed: 0,
      resolutionRate: 0,
      timeSavedHours: 0,
      responseTimeSeconds: 0.0
    };
  }, [stats]);

  const last6DaysSubscribers = React.useMemo(() => {
    if (!stats || !stats.dailyStats || stats.dailyStats.length === 0) return [10, 20, 30, 40, 50, 60];
    const data = stats.dailyStats.slice(-6).map((d) => d.activeUsers + d.clicks + 5);
    while (data.length < 6) {
      data.unshift(5);
    }
    return data;
  }, [stats]);

  const last6DaysActiveUsers = React.useMemo(() => {
    if (!stats || !stats.dailyStats || stats.dailyStats.length === 0) return [5, 10, 8, 15, 12, 20];
    const data = stats.dailyStats.slice(-6).map((d) => d.activeUsers);
    while (data.length < 6) {
      data.unshift(0);
    }
    return data;
  }, [stats]);

  const last6DaysClicks = React.useMemo(() => {
    if (!stats || !stats.dailyStats || stats.dailyStats.length === 0) return [15, 25, 20, 35, 30, 45];
    const data = stats.dailyStats.slice(-6).map((d) => d.clicks);
    while (data.length < 6) {
      data.unshift(0);
    }
    return data;
  }, [stats]);

  const last6DaysActiveBots = React.useMemo(() => {
    if (!stats || !stats.dailyStats || stats.dailyStats.length === 0) return [0, 0, 0, 0, 1, 2];
    const data = stats.dailyStats.slice(-6).map((d) => (d.activeUsers > 0 || d.clicks > 0 ? (stats?.activeAutomations || 1) : 0));
    while (data.length < 6) {
      data.unshift(0);
    }
    return data;
  }, [stats]);

  const chartData = React.useMemo(() => {
    const totalSub = stats?.totalSubscribers ?? 100;
    const colors = ['#6366f1', '#a855f7', '#3b82f6', '#10b981', '#f59e0b'];
    return tagStats.map((tag, idx) => {
      const pct = totalSub > 0 ? Math.round((tag.count / totalSub) * 100) : 0;
      return {
        name: tag.name,
        count: tag.count,
        pct: pct,
        color: colors[idx % colors.length]
      };
    });
  }, [tagStats, stats]);

  const handlePeriodChange = (val: number) => {
    setDays(val);
  };

  const handleBotChange = (id: number) => {
    setSelectedBotId(id);
    setIsBotSelectorOpen(false);
  };

  const currentBot = bots.find((b) => b.id === selectedBotId);

  const renderActivityChart = () => {
    if (!stats) return null;

    const rawData = stats.dailyStats || [];
    const today = new Date();
    const data: { date: string; activeUsers: number; clicks: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const dayStr = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${dayStr}`;

      const found = rawData.find((item) => item.date === dateStr);
      if (found) {
        data.push(found);
      } else {
        data.push({
          date: dateStr,
          activeUsers: 0,
          clicks: 0,
        });
      }
    }

    const width = 1000;
    const height = 170;
    const padding = 28;

    const maxVal = Math.max(
      ...data.map((d) => Math.max(d.activeUsers, d.clicks, 5))
    );

    const getX = (index: number) => {
      if (data.length <= 1) return padding + (width - padding * 2) / 2;
      return padding + (index / (data.length - 1)) * (width - padding * 2);
    };

    const getY = (val: number) => {
      return height - padding - (val / maxVal) * (height - padding * 2);
    };

    const handleMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
      if (!stats || data.length === 0) return;
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
                  r={isHovered ? "5.5" : "3.5"}
                  fill={isHovered ? "#6366f1" : "#ffffff"}
                  stroke="#6366f1"
                  strokeWidth={isHovered ? "2.5" : "1.8"}
                  style={{ transition: 'all 0.15s ease-out' }}
                />
                <circle
                  cx={x}
                  cy={yClicks}
                  r={isHovered ? "5.5" : "3.5"}
                  fill={isHovered ? "#10b981" : "#ffffff"}
                  stroke="#10b981"
                  strokeWidth={isHovered ? "2.5" : "1.8"}
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
                  transition: 'left 0.12s ease-out'
                };
              } else if (xPercent > 80) {
                return {
                  right: `${100 - xPercent}%`,
                  top: `8%`,
                  transform: `translateX(-10px)`,
                  transition: 'right 0.12s ease-out'
                };
              } else {
                return {
                  left: `${xPercent}%`,
                  top: `8%`,
                  transform: `translateX(-50%)`,
                  transition: 'left 0.12s ease-out'
                };
              }
            })()}
          >
            <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider select-none">
              {(() => {
                const dateParts = data[hoveredIdx].date.split('-');
                return dateParts.length >= 3 ? `${dateParts[2]}.${dateParts[1]}.${dateParts[0]}` : data[hoveredIdx].date;
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

  const renderActivityHeatmap = () => {
    if (!stats) return null;

    const daysOfWeek = [
      t('dashboard.stats.heatmap.days.sun'),
      t('dashboard.stats.heatmap.days.mon'),
      t('dashboard.stats.heatmap.days.tue'),
      t('dashboard.stats.heatmap.days.wed'),
      t('dashboard.stats.heatmap.days.thu'),
      t('dashboard.stats.heatmap.days.fri'),
      t('dashboard.stats.heatmap.days.sat')
    ];

    const orderedDayIndexes = [1, 2, 3, 4, 5, 6, 0];
    const maxVal = Math.max(...(stats.activityHeatmap?.map((h) => h.count) || []), 1);

    return (
      <div className="w-full overflow-x-auto select-none pb-1 font-['JetBrains_Mono',monospace]">
        <div className="min-w-[580px]">
          <div className="flex items-center mb-1.5 pl-8">
            {Array.from({ length: 24 }).map((_, hour) => (
              <div 
                key={hour} 
                className="flex-1 text-center text-[9px] font-black text-[#0A0A0A]/60"
              >
                {String(hour).padStart(2, '0')}
              </div>
            ))}
          </div>

          <div className="space-y-1">
            {orderedDayIndexes.map((dayIdx) => {
              const dayName = daysOfWeek[dayIdx];

              return (
                <div key={dayIdx} className="flex items-center gap-1">
                  <div className="w-7 text-[10px] font-extrabold text-[#0A0A0A] text-left pr-2 shrink-0 uppercase">
                    {dayName}
                  </div>

                  <div className="flex-1 flex gap-1">
                    {Array.from({ length: 24 }).map((_, hour) => {
                      const entry = stats.activityHeatmap?.find(
                        (h) => h.dayOfWeek === dayIdx && h.hour === hour
                      );
                      const count = entry ? entry.count : 0;
                      const opacity = count > 0 ? 0.2 + (count / maxVal) * 0.8 : 0;
                      const backgroundColor = count > 0 ? `rgba(99, 102, 241, ${opacity})` : '#e2e8f0';

                      return (
                        <div
                          key={hour}
                          className="flex-1 rounded-[2px] border border-[#0A0A0A]/20 transition-all duration-200 hover:scale-110 cursor-pointer"
                          style={{ backgroundColor, height: '10px', minHeight: '10px' }}
                          title={`${dayName}, ${String(hour).padStart(2, '0')}:00 — ${count} ${t('dashboard.stats.actions_count_label')}`}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-end gap-1.5 mt-2 text-[9px] font-bold text-[#0A0A0A] pr-1">
            <span>{t('dashboard.stats.heatmap.less')}</span>
            <div className="w-2.5 h-2.5 bg-slate-200 border border-[#0A0A0A]/30 rounded-sm" />
            <div className="w-2.5 h-2.5 bg-indigo-200 border border-[#0A0A0A]/30 rounded-sm" />
            <div className="w-2.5 h-2.5 bg-indigo-400 border border-[#0A0A0A]/30 rounded-sm" />
            <div className="w-2.5 h-2.5 bg-indigo-600 border border-[#0A0A0A]/30 rounded-sm" />
            <span>{t('dashboard.stats.heatmap.more')}</span>
          </div>
        </div>
      </div>
    );
  };

  const hasNoBots = connectedBots.length === 0;
  const isMultipleBots = connectedBots.length > 1;

  return (
    <DashboardLayout>
      <div className="flex flex-col bg-[#F2EBDD] font-['Geist',sans-serif] min-h-full pb-6">
        
        {/* Top Header */}
        <header className="bg-[#F2EBDD] border-b-2 border-[#0A0A0A] px-6 py-4 flex flex-row justify-between items-center gap-4 shrink-0 z-20">
          <div>
            <h1 className="font-['Anybody',sans-serif] text-2xl font-black text-[#0A0A0A] uppercase tracking-tight flex items-center gap-2.5 select-none">
              <TrendingUp size={22} className="text-[#0A0A0A]" />
              <span>{t('dashboard.stats.title')}</span>
            </h1>
            <p className="font-['JetBrains_Mono',monospace] text-xs font-bold text-slate-700 mt-1 uppercase">{t('dashboard.stats.subtitle')}</p>
          </div>

          {connectedBots.length > 0 && (
            <div className="relative" ref={botSelectorRef}>
              <button
                onClick={() => {
                  if (isMultipleBots) {
                    setIsBotSelectorOpen(!isBotSelectorOpen);
                  }
                }}
                className={`flex items-center gap-2 px-4 py-2 bg-white border-2 border-[#0A0A0A] rounded-xl text-[#0A0A0A] font-['JetBrains_Mono',monospace] text-xs font-bold transition-all select-none min-w-[180px] justify-between ${
                  isMultipleBots ? 'hover:bg-[#0A0A0A] hover:text-[#F2EBDD] cursor-pointer' : 'cursor-default'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <MessageSquare size={14} className="shrink-0" />
                  <span className="truncate">
                    {selectedBotId === 0 ? t('dashboard.stats.all_automation') : (currentBot ? currentBot.name : t('dashboard.stats.select_bot'))}
                  </span>
                </div>
                {isMultipleBots && <ChevronDown size={14} className="shrink-0" />}
              </button>

              {isBotSelectorOpen && isMultipleBots && (
                <div className="absolute right-0 mt-2 w-60 bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-xl shadow-xl py-1 z-35 max-h-60 overflow-y-auto font-['JetBrains_Mono',monospace]">
                  <button
                    onClick={() => handleBotChange(0)}
                    className={`w-full text-left px-4 py-2.5 text-xs font-bold transition-colors cursor-pointer block truncate ${
                      selectedBotId === 0
                        ? 'bg-[#0A0A0A] text-[#F2EBDD]'
                        : 'text-[#0A0A0A] hover:bg-white'
                    }`}
                  >
                    {t('dashboard.stats.all_automation')}
                  </button>
                  
                  {connectedBots.map((bot) => (
                    <button
                      key={bot.id}
                      onClick={() => handleBotChange(bot.id)}
                      className={`w-full text-left px-4 py-2.5 text-xs font-bold transition-colors cursor-pointer block truncate ${
                        bot.id === selectedBotId
                          ? 'bg-[#0A0A0A] text-[#F2EBDD]'
                          : 'text-[#0A0A0A] hover:bg-white'
                      }`}
                    >
                      {bot.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </header>

        <div className="p-6 space-y-6">
          {hasNoBots ? (
            <div className="h-full flex items-center justify-center p-12 text-center bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-3xl shadow-[4px_4px_0px_#0A0A0A]">
              <div className="max-w-md space-y-4 font-['JetBrains_Mono',monospace]">
                <div className="w-16 h-16 rounded-2xl bg-white border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] flex items-center justify-center mx-auto text-[#0A0A0A]">
                  <AlertCircle size={32} />
                </div>
                <p className="font-['Anybody',sans-serif] font-black text-[#0A0A0A] text-xl uppercase tracking-tight">{t('dashboard.stats.no_bot_title')}</p>
                <p className="font-['Geist',sans-serif] text-xs text-[#0A0A0A]/70 font-semibold max-w-xs mx-auto leading-relaxed">
                  {t('dashboard.stats.no_bot_desc')}
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => navigate('/connect-bot')}
                    className="px-6 py-3 bg-[#0A0A0A] text-[#F2EBDD] font-['JetBrains_Mono',monospace] text-xs font-black uppercase tracking-wider border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] hover:bg-white hover:text-[#0A0A0A] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all cursor-pointer inline-flex items-center gap-2"
                  >
                    <Plus size={14} />
                    <span>{t('connect_bot.btn_connect_existing', 'Connect Bot')}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : isLoading ? (
            <div className="h-96 flex flex-col items-center justify-center gap-3 font-['JetBrains_Mono',monospace]">
              <Loader2 className="animate-spin text-[#0A0A0A]" size={32} />
              <span className="text-xs font-bold text-[#0A0A0A] uppercase tracking-wider">{t('dashboard.stats.loading')}</span>
            </div>
          ) : error ? (
            <div className="p-6 bg-rose-100 border-2 border-[#0A0A0A] rounded-2xl flex items-center gap-3 text-rose-900 text-xs font-bold font-['JetBrains_Mono',monospace]">
              <AlertCircle size={18} className="shrink-0" />
              <span>{t('dashboard.stats.error')}: {error.message}</span>
            </div>
          ) : (
            <div className="space-y-6 w-full">

              {/* 4 Top Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

                {/* Stat 1: Total Subscribers */}
                <div className="bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-3xl p-5 relative overflow-hidden flex flex-col justify-between group select-none min-h-[150px]">
                  <div className="flex justify-between items-start">
                    <span className="font-['JetBrains_Mono',monospace] text-[10px] font-black text-[#0A0A0A]/70 uppercase tracking-widest block">{t('dashboard.stats.total_subscribers')}</span>
                    <button className="text-[#0A0A0A] hover:opacity-70 transition-opacity cursor-pointer">
                      <MoreVertical size={14} />
                    </button>
                  </div>
                  <div className="my-2 select-text">
                    <span className="font-['Anybody',sans-serif] text-3xl font-black text-[#0A0A0A] tracking-tight block">
                      {stats?.totalSubscribers ?? 0}
                    </span>
                    <span className={`font-['JetBrains_Mono',monospace] text-[10px] font-extrabold flex items-center gap-1 mt-0.5 ${(stats?.subscribersGrowth ?? 0) >= 0 ? 'text-indigo-700' : 'text-rose-600'}`}>
                      {(stats?.subscribersGrowth ?? 0) >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      <span>
                        {(stats?.subscribersGrowth ?? 0) >= 0 ? '+' : ''}
                        {stats?.subscribersGrowth ?? 0}% {t('dashboard.stats.growth.vs_last_week')}
                      </span>
                    </span>
                  </div>
                  <div className="mt-1 flex justify-between items-end border-t border-[#0A0A0A]/20 pt-2.5">
                    <span className="font-['JetBrains_Mono',monospace] text-[9px] font-bold text-[#0A0A0A]/70 uppercase">{t('dashboard.stats.lifetime_total')}</span>
                    <MiniBarChart data={last6DaysSubscribers} color="#818cf8" />
                  </div>
                </div>

                {/* Stat 2: Active Users */}
                <div className="bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-3xl p-5 relative overflow-hidden flex flex-col justify-between group select-none min-h-[150px]">
                  <div className="flex justify-between items-start">
                    <span className="font-['JetBrains_Mono',monospace] text-[10px] font-black text-[#0A0A0A]/70 uppercase tracking-widest block">{t('dashboard.stats.active_users')}</span>
                    <button className="text-[#0A0A0A] hover:opacity-70 transition-opacity cursor-pointer">
                      <MoreVertical size={14} />
                    </button>
                  </div>
                  <div className="my-2 select-text">
                    <span className="font-['Anybody',sans-serif] text-3xl font-black text-[#0A0A0A] tracking-tight block">
                      {stats?.activeUsers24h ?? 0}
                    </span>
                    <span className={`font-['JetBrains_Mono',monospace] text-[10px] font-extrabold flex items-center gap-1 mt-0.5 ${(stats?.activeUsersGrowth ?? 0) >= 0 ? 'text-violet-700' : 'text-rose-600'}`}>
                      {(stats?.activeUsersGrowth ?? 0) >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      <span>
                        {(stats?.activeUsersGrowth ?? 0) >= 0 ? '+' : ''}
                        {stats?.activeUsersGrowth ?? 0}% {t('dashboard.stats.growth.vs_yesterday')}
                      </span>
                    </span>
                  </div>
                  <div className="mt-1 flex justify-between items-end border-t border-[#0A0A0A]/20 pt-2.5">
                    <span className="font-['JetBrains_Mono',monospace] text-[9px] font-bold text-[#0A0A0A]/70 uppercase">{t('dashboard.stats.unique_visitors')}</span>
                    <MiniBarChart data={last6DaysActiveUsers} color="#c084fc" />
                  </div>
                </div>

                {/* Stat 3: Total Clicks */}
                <div className="bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-3xl p-5 relative overflow-hidden flex flex-col justify-between group select-none min-h-[150px]">
                  <div className="flex justify-between items-start">
                    <span className="font-['JetBrains_Mono',monospace] text-[10px] font-black text-[#0A0A0A]/70 uppercase tracking-widest block">{t('dashboard.stats.total_clicks')}</span>
                    <button className="text-[#0A0A0A] hover:opacity-70 transition-opacity cursor-pointer">
                      <MoreVertical size={14} />
                    </button>
                  </div>
                  <div className="my-2 select-text">
                    <span className="font-['Anybody',sans-serif] text-3xl font-black text-[#0A0A0A] tracking-tight block">
                      {stats?.clicksCount30d ?? 0}
                    </span>
                    <span className={`font-['JetBrains_Mono',monospace] text-[10px] font-extrabold flex items-center gap-1 mt-0.5 ${(stats?.clicksGrowth ?? 0) >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                      {(stats?.clicksGrowth ?? 0) >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      <span>
                        {(stats?.clicksGrowth ?? 0) >= 0 ? '+' : ''}
                        {stats?.clicksGrowth ?? 0}% {t('dashboard.stats.growth.vs_last_month')}
                      </span>
                    </span>
                  </div>
                  <div className="mt-1 flex justify-between items-end border-t border-[#0A0A0A]/20 pt-2.5">
                    <span className="font-['JetBrains_Mono',monospace] text-[9px] font-bold text-[#0A0A0A]/70 uppercase">{t('dashboard.stats.interaction_counts')}</span>
                    <MiniBarChart data={last6DaysClicks} color="#34d399" />
                  </div>
                </div>

                {/* Stat 4: Active Automations */}
                <div className="bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-3xl p-5 relative overflow-hidden flex flex-col justify-between group select-none min-h-[150px]">
                  <div className="flex justify-between items-start">
                    <span className="font-['JetBrains_Mono',monospace] text-[10px] font-black text-[#0A0A0A]/70 uppercase tracking-widest block">{t('dashboard.stats.active_automations')}</span>
                    <button className="text-[#0A0A0A] hover:opacity-70 transition-opacity cursor-pointer">
                      <MoreVertical size={14} />
                    </button>
                  </div>
                  <div className="my-2 select-text">
                    <span className="font-['Anybody',sans-serif] text-3xl font-black text-[#0A0A0A] tracking-tight block">
                      {stats?.activeAutomations ?? 0}
                    </span>
                    <span className={`font-['JetBrains_Mono',monospace] text-[10px] font-extrabold flex items-center gap-1 mt-0.5 ${(stats?.automationsGrowth ?? 0) >= 0 ? 'text-amber-700' : 'text-rose-600'}`}>
                      {(stats?.automationsGrowth ?? 0) >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      <span>
                        {(stats?.automationsGrowth ?? 0) >= 0 ? '+' : ''}
                        {stats?.automationsGrowth ?? 0}% {t('dashboard.stats.growth.vs_last_week')}
                      </span>
                    </span>
                  </div>
                  <div className="mt-1 flex justify-between items-end border-t border-[#0A0A0A]/20 pt-2.5">
                    <span className="font-['JetBrains_Mono',monospace] text-[9px] font-bold text-[#0A0A0A]/70 uppercase">{t('dashboard.stats.active_bots_count')}</span>
                    <MiniBarChart data={last6DaysActiveBots} color="#fbbf24" />
                  </div>
                </div>

              </div>

              {/* Middle Row: Interaction History Chart & Top Buttons */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Line Chart */}
                <div className="lg:col-span-2 bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-2xl p-5 flex flex-col justify-between lg:h-[310px] overflow-hidden">
                  <div className="flex flex-row justify-between items-center mb-4 select-none font-['JetBrains_Mono',monospace]">
                    <div className="space-y-1">
                      <h2 className="font-['Anybody',sans-serif] text-xs font-black text-[#0A0A0A] uppercase tracking-widest">{t('dashboard.stats.interaction_history')}</h2>
                      <div className="flex items-center gap-4 text-[10px] font-bold mt-1">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 border border-[#0A0A0A]" />
                          <span className="text-[#0A0A0A]">{t('dashboard.stats.active_users_legend')}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-[#0A0A0A]" />
                          <span className="text-[#0A0A0A]">{t('dashboard.stats.button_clicks_legend')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 bg-white p-1 rounded-xl border-2 border-[#0A0A0A] shrink-0">
                      {[
                        { label: t('dashboard.stats.days_7'), val: 7 },
                        { label: t('dashboard.stats.days_14'), val: 14 },
                        { label: t('dashboard.stats.days_30'), val: 30 },
                      ].map((p) => (
                        <button
                          key={p.val}
                          onClick={() => handlePeriodChange(p.val)}
                          className={`px-3 py-1 text-[10px] font-extrabold uppercase transition-all cursor-pointer ${
                            days === p.val
                              ? 'bg-[#0A0A0A] text-[#F2EBDD]'
                              : 'text-[#0A0A0A] hover:bg-[#0A0A0A]/10'
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  {renderActivityChart()}
                </div>

                {/* Top Buttons Progress List */}
                <div className="bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-2xl p-5 flex flex-col lg:h-[310px]">
                  <div className="mb-4">
                    <h2 className="font-['Anybody',sans-serif] text-xs font-black text-[#0A0A0A] uppercase tracking-widest">{t('dashboard.stats.top_clicked_buttons')}</h2>
                    <p className="font-['JetBrains_Mono',monospace] text-[10px] text-slate-700 mt-1 uppercase">{t('dashboard.stats.top_clicked_buttons_desc')}</p>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-4 pr-1 select-none custom-scrollbar">
                    {!stats || !stats.topButtons || stats.topButtons.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-center p-6 text-[#0A0A0A] text-xs font-bold font-['JetBrains_Mono',monospace]">
                        {t('dashboard.stats.no_buttons')}
                      </div>
                    ) : (
                      (() => {
                        const sumClicks = stats.topButtons.reduce((acc, b) => acc + b.clicks, 0);
                        const total = sumClicks > 0 ? sumClicks : 1;

                        return stats.topButtons.map((btn, idx) => {
                          const pct = Math.round((btn.clicks / total) * 100);

                          return (
                            <div key={idx} className="space-y-1.5 font-['JetBrains_Mono',monospace]">
                              <div className="flex justify-between items-center text-xs font-bold text-[#0A0A0A]">
                                <span className="truncate max-w-[170px] uppercase">{btn.buttonName || t('dashboard.stats.option_button')}</span>
                                <span className="text-[10.5px] text-[#0A0A0A] font-extrabold flex gap-1.5 items-center">
                                  <span>{t('dashboard.stats.clicks_count', { count: btn.clicks })}</span>
                                  <span>•</span>
                                  <span className="text-indigo-700 font-black">{pct}%</span>
                                </span>
                              </div>
                              <div className="w-full h-2 bg-white border border-[#0A0A0A] overflow-hidden">
                                <div 
                                  className="h-full bg-indigo-600 transition-all duration-500 ease-out" 
                                  style={{ width: `${pct}%` }} 
                                />
                              </div>
                            </div>
                          );
                        });
                      })()
                    )}
                  </div>
                </div>

              </div>

              {/* Bottom Row: AI Insights, Tags Breakdown, Activity Heatmap */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
                
                {/* AI Insights */}
                <div className="bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-2xl p-5 flex flex-col justify-between lg:col-span-3 lg:h-[275px]">
                  <div>
                    <h2 className="font-['Anybody',sans-serif] text-xs font-black text-[#0A0A0A] uppercase tracking-widest block mb-1">{t('dashboard.stats.ai_insights_title')}</h2>
                    <p className="font-['JetBrains_Mono',monospace] text-[10px] text-slate-700 mb-3 mt-0.5 uppercase">{t('dashboard.stats.ai_insights_desc')}</p>
                    
                    <div className="grid grid-cols-2 gap-2.5 font-['JetBrains_Mono',monospace]">
                      <div className="p-2.5 bg-white border-2 border-[#0A0A0A] rounded-xl flex flex-col justify-center min-h-[56px]">
                        <span className="text-[9px] font-black text-[#0A0A0A]/70 uppercase tracking-wider block mb-0.5">{t('dashboard.stats.ai_messages')}</span>
                        <span className="text-base font-black text-[#0A0A0A] flex items-center gap-1.5">
                          <AiIcon size={13} className="text-indigo-600" />
                          {aiStats.messagesProcessed}
                        </span>
                      </div>
                      
                      <div className="p-2.5 bg-white border-2 border-[#0A0A0A] rounded-xl flex flex-col justify-center min-h-[56px]">
                        <span className="text-[9px] font-black text-[#0A0A0A]/70 uppercase tracking-wider block mb-0.5">{t('dashboard.stats.ai_resolution_rate')}</span>
                        <span className="text-base font-black text-[#0A0A0A]">{aiStats.resolutionRate}%</span>
                      </div>
                      
                      <div className="p-2.5 bg-white border-2 border-[#0A0A0A] rounded-xl flex flex-col justify-center min-h-[56px]">
                        <span className="text-[9px] font-black text-[#0A0A0A]/70 uppercase tracking-wider block mb-0.5">{t('dashboard.stats.ai_time_saved')}</span>
                        <span className="text-base font-black text-emerald-700 flex items-center gap-1.5">
                          <Clock size={13} className="text-emerald-600" />
                          {aiStats.timeSavedHours}h
                        </span>
                      </div>
                      
                      <div className="p-2.5 bg-white border-2 border-[#0A0A0A] rounded-xl flex flex-col justify-center min-h-[56px]">
                        <span className="text-[9px] font-black text-[#0A0A0A]/70 uppercase tracking-wider block mb-0.5">{t('dashboard.stats.ai_response_time')}</span>
                        <span className="text-base font-black text-[#0A0A0A]">{aiStats.responseTimeSeconds}s</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tags Breakdown */}
                <div className="bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-2xl p-5 flex flex-col justify-between lg:col-span-3 lg:h-[275px]">
                  <div>
                    <h2 className="font-['Anybody',sans-serif] text-xs font-black text-[#0A0A0A] uppercase tracking-widest block mb-1 select-none">{t('dashboard.stats.tags_breakdown_title')}</h2>
                    <p className="font-['JetBrains_Mono',monospace] text-[10px] text-slate-700 mb-3 mt-0.5 uppercase">{t('dashboard.stats.tags_breakdown_desc')}</p>
                    
                    {tagStats.length === 0 ? (
                      <div className="py-6 text-center text-xs font-bold text-[#0A0A0A] font-['JetBrains_Mono',monospace] flex flex-col items-center gap-2 select-none">
                        <HelpCircle size={22} className="text-[#0A0A0A]" />
                        <span>{t('dashboard.stats.no_tags_found')}</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3 justify-center">
                        <div className="shrink-0">
                          <SemiDonutChart data={chartData} total={stats?.totalSubscribers ?? 0} />
                        </div>
                        <div className="w-full space-y-2 max-h-[90px] overflow-y-auto pr-1 custom-scrollbar font-['JetBrains_Mono',monospace]">
                          {chartData.map((tag) => (
                            <div key={tag.name} className="flex justify-between items-center text-xs font-semibold select-none">
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="w-2 h-3 border border-[#0A0A0A] shrink-0" style={{ backgroundColor: tag.color }} />
                                <span className="text-[#0A0A0A] font-bold truncate text-[11px] uppercase">{tag.name}</span>
                              </div>
                              <div className="flex items-center gap-3 text-[#0A0A0A] font-extrabold text-[10.5px] shrink-0">
                                <span>{tag.count.toLocaleString()}</span>
                                <span>{tag.pct}%</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Activity Heatmap */}
                <div className="bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-2xl p-5 flex flex-col justify-between h-full lg:col-span-6 lg:h-[275px]">
                  <div>
                    <div className="mb-3">
                      <h2 className="font-['Anybody',sans-serif] text-xs font-black text-[#0A0A0A] uppercase tracking-widest block mb-1">{t('dashboard.stats.activity_heatmap_title')}</h2>
                      <p className="font-['JetBrains_Mono',monospace] text-[10px] text-slate-700 mt-0.5 uppercase">{t('dashboard.stats.activity_heatmap_desc')}</p>
                    </div>
                    {renderActivityHeatmap()}
                  </div>
                </div>

              </div>

            </div>
          )}
        </div>

      </div>
    </DashboardLayout>
  );
};

export default DashboardStatsPage;
