import React, { useState, useEffect, useRef } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { fetchAdminStatsApi } from '../../../api/admin';
import { AdminLayout } from '../../../components/layout/AdminLayout';
import {
  Users,
  UserCheck,
  Bot,
  Workflow,
  Send,
  Clock,
  Server,
  CheckCircle2,
  TrendingUp,
  Loader2,
  MessageSquare,
  Activity,
  Search,
  CalendarDays,
  ChevronDown,
  DollarSign,
  CreditCard
} from 'lucide-react';
import { getLanguage, useTranslation } from '../../../i18n/config';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../store/useAuthStore';

export const AdminStatsPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const isManager = currentUser?.role === 'ROLE_MANAGER';

  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [hoveredPerfIdx, setHoveredPerfIdx] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [period, setPeriod] = useState<'day' | 'week' | '2weeks' | 'month' | '2months' | '3months' | 'all' | 'custom'>('week');
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());

  const [isPeriodOpen, setIsPeriodOpen] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const [visibleMetrics, setVisibleMetrics] = useState<Record<string, boolean>>({
    owners: true,
    activeOwners: true,
    clients: true,
    bots: true,
    automations: true,
    messages: true
  });

  const [tempStart, setTempStart] = useState('');
  const [tempEnd, setTempEnd] = useState('');

  const dropdownRef = useRef<HTMLDivElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 350);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    if (period === 'custom') return;

    queueMicrotask(() => {
      const now = new Date();
      const currentEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 19, 0, 0);
      if (currentEnd > now) {
        currentEnd.setDate(currentEnd.getDate() - 1);
      }
      setEndDate(now);

      const start = new Date(currentEnd);
      if (period === 'day') {
        start.setDate(start.getDate() - 1);
      } else if (period === 'week') {
        start.setDate(start.getDate() - 7);
      } else if (period === '2weeks') {
        start.setDate(start.getDate() - 14);
      } else if (period === 'month') {
        start.setMonth(start.getMonth() - 1);
      } else if (period === '2months') {
        start.setMonth(start.getMonth() - 2);
      } else if (period === '3months') {
        start.setMonth(start.getMonth() - 3);
      } else if (period === 'all') {
        start.setFullYear(start.getFullYear() - 1);
      }
      setStartDate(start);
    });
  }, [period]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsPeriodOpen(false);
      }
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toIsoStringLocal = (date: Date) => {
    const pad = (num: number) => String(num).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  };

  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['adminStats', debouncedSearch, period, toIsoStringLocal(startDate), toIsoStringLocal(endDate)],
    queryFn: () => fetchAdminStatsApi(
      debouncedSearch,
      period,
      toIsoStringLocal(startDate),
      toIsoStringLocal(endDate)
    ),
    placeholderData: keepPreviousData,
    refetchInterval: 15000,
  });

  const renderPlanDoughnut = (distribution: any[] = []) => {
    const total = distribution.reduce((sum, item) => sum + (item.value || 0), 0);
    if (total === 0) {
      return (
        <div className="flex items-center justify-center h-28 text-xs font-bold text-slate-400 w-full">
          Немає активних підписок
        </div>
      );
    }

    let accumulatedPercentage = 0;
    const radius = 38;
    const circumference = 2 * Math.PI * radius;

    return (
      <div className="flex items-center justify-between gap-6 w-full h-28">
        <div className="relative w-24 h-24 shrink-0">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="transparent"
              stroke="#f1f5f9"
              strokeWidth="9"
            />
            {distribution.map((item, idx) => {
              if (item.value === 0) return null;

              const percentage = item.value / total;
              const strokeLength = percentage * circumference;
              const strokeOffset = -accumulatedPercentage * circumference;
              accumulatedPercentage += percentage;

              return (
                <circle
                  key={idx}
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="transparent"
                  stroke={item.color}
                  strokeWidth="9"
                  strokeDasharray={`${strokeLength} ${circumference}`}
                  strokeDashoffset={strokeOffset}
                  strokeLinecap="round"
                  className="transition-all duration-300 ease-out"
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center select-none leading-none">
            <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-wider mb-0.5">
              {t('admin.total') || 'Всього'}
            </span>
            <span className="text-sm font-black text-slate-800">
              {total}
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-1.5 w-full max-h-24 overflow-y-auto pr-1">
          {distribution.map((item, idx) => {
            const percentage = total > 0 ? Math.round((item.value / total) * 100) : 0;
            return (
              <div key={idx} className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                <div className="flex items-center space-x-1.5 truncate">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="truncate">{item.name}</span>
                </div>
                <span className="text-slate-400 shrink-0 ml-1.5 font-mono text-[10px]">
                  {item.value} ({percentage}%)
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const formatUptime = (totalSeconds: number = 0) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

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
        hour12: getLanguage() !== 'uk'
      });
    } catch (e) {
      return dateStr;
    }
  };

  const formatDateRangeDisplay = () => {
    const locale = getLanguage() === 'uk' ? 'uk-UA' : 'en-US';
    const opt: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: getLanguage() !== 'uk'
    };
    return `${startDate.toLocaleString(locale, opt)} - ${endDate.toLocaleString(locale, opt)}`;
  };

  const getPeriodLabel = (p: string) => {
    switch (p) {
      case 'day': return t('admin.period_day');
      case 'week': return t('admin.7_days');
      case '2weeks': return t('admin.period_2weeks');
      case 'month': return t('admin.30_days');
      case '2months': return t('admin.period_2months');
      case '3months': return t('admin.90_days');
      case 'all': return t('admin.all_time');
      case 'custom': return t('admin.period_custom');
      default: return p;
    }
  };

  const periodOptions: Array<'day' | 'week' | '2weeks' | 'month' | '2months' | '3months' | 'all' | 'custom'> = [
    'day', 'week', '2weeks', 'month', '2months', '3months', 'all', 'custom'
  ];

  const handleApplyCustomDates = () => {
    if (tempStart && tempEnd) {
      setStartDate(new Date(tempStart));
      setEndDate(new Date(tempEnd));
      setPeriod('custom');
      setIsPickerOpen(false);
    }
  };

  const metricConfigs = [
    { key: 'owners', label: t('admin.site_owners') || 'Власники', color: '#6366f1', valueKey: 'registeredCount' },
    { key: 'activeOwners', label: t('admin.active_owners') || 'Активні Власники', color: '#10b981', valueKey: 'activeCount' },
    { key: 'clients', label: t('admin.bot_clients') || 'Клієнти', color: '#0ea5e9', valueKey: 'clientsCount' },
    { key: 'bots', label: t('admin.active_bots') || 'Активні Боти', color: '#a855f7', valueKey: 'botsCount' },
    { key: 'automations', label: t('admin.total_automations') || 'Автоматизації', color: '#f59e0b', valueKey: 'automationsCount' },
    { key: 'messages', label: t('admin.messages_sent') || 'Повідомлень', color: '#ec4899', valueKey: 'messagesCount' }
  ];

  const renderTrendChart = () => {
    const rawGrowth = stats?.userGrowth || [];
    if (rawGrowth.length === 0) return null;

    const width = 1000;
    const height = 220;
    const padding = 35;

    const activeConfigs = metricConfigs.filter(cfg => visibleMetrics[cfg.key]);

    const maxVal = Math.max(
      ...rawGrowth.map((g: any) => {
        const vals = activeConfigs.map(cfg => g[cfg.valueKey] || 0);
        return vals.length > 0 ? Math.max(...vals, 5) : 5;
      })
    );

    const getX = (index: number) => {
      if (rawGrowth.length <= 1) return padding + (width - padding * 2) / 2;
      return padding + (index / (rawGrowth.length - 1)) * (width - padding * 2);
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
      for (let i = 0; i < rawGrowth.length; i++) {
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

      rawGrowth.forEach((d: any, idx: number) => {
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
          const prevVal = (rawGrowth[idx - 1] as any)[cfg.valueKey] ?? 0;
          const prevY = getY(prevVal);

          linePath += ` C ${cpX1} ${prevY}, ${cpX2} ${y}, ${x} ${y}`;
          fillPath += ` C ${cpX1} ${prevY}, ${cpX2} ${y}, ${x} ${y}`;
        }

        if (idx === rawGrowth.length - 1) {
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

          {rawGrowth.map((d: unknown, idx: number) => {
            const x = getX(idx);
            const isHovered = idx === hoveredIdx;

            return (
              <g key={idx}>
                {activeConfigs.map(cfg => {
                  const val = (d as any)[cfg.valueKey] ?? 0;
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

          {rawGrowth.map((d: any, idx: number) => {
            const x = getX(idx);
            const skipCount = Math.ceil(rawGrowth.length / 7);
            const shouldShow = idx === 0 || idx === rawGrowth.length - 1 || idx % skipCount === 0;
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

        {hoveredIdx !== null && rawGrowth[hoveredIdx] && (
          <div
            className="absolute bg-slate-900/95 text-white px-3.5 py-2.5 rounded-2xl shadow-xl pointer-events-none text-left z-30 flex flex-col gap-1.5 min-w-[190px] border border-slate-800 animate-fade-in"
            style={(() => {
              const xPercent = (getX(hoveredIdx) / width) * 100;
              if (xPercent < 20) {
                return {
                  left: `${xPercent}%`,
                  top: `10%`,
                  transform: `translateX(10px)`,
                  transition: 'left 0.12s ease-out'
                };
              } else if (xPercent > 80) {
                return {
                  right: `${100 - xPercent}%`,
                  top: `10%`,
                  transform: `translateX(-10px)`,
                  transition: 'right 0.12s ease-out'
                };
              } else {
                return {
                  left: `${xPercent}%`,
                  top: `10%`,
                  transform: `translateX(-50%)`,
                  transition: 'left 0.12s ease-out'
                };
              }
            })()}
          >
            <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider select-none border-b border-slate-800 pb-1">
              {formatDateLabel(rawGrowth[hoveredIdx].date)}
            </div>
            {activeConfigs.map(cfg => (
              <div key={`tooltip-${cfg.key}`} className="flex items-center justify-between gap-4 text-xs select-none">
                <span className="flex items-center gap-1.5 font-bold text-slate-300">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cfg.color }}></span>
                  {cfg.label}
                </span>
                <span className="font-extrabold text-white">
                  {(rawGrowth[hoveredIdx] as any)[cfg.valueKey] ?? 0}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderPerformanceChart = () => {
    const data = stats?.performanceMetrics || [];
    if (data.length === 0) return null;

    const width = 800;
    const height = 180;
    const padding = 30;

    const maxLatency = Math.max(...data.map(d => d.latency || 50), 200);
    const maxErrorRate = Math.max(...data.map(d => d.errorRate || 0.5), 3.0);

    const getX = (index: number) => {
      if (data.length <= 1) return padding + (width - padding * 2) / 2;
      return padding + (index / (data.length - 1)) * (width - padding * 2);
    };

    const getLatencyY = (val: number) => {
      return height - padding - (val / maxLatency) * (height - padding * 2);
    };

    const getErrorY = (val: number) => {
      return height - padding - (val / maxErrorRate) * (height - padding * 2);
    };

    const handleMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
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
      setHoveredPerfIdx(closestIdx);
    };
    let latencyLine = '';
    let latencyFill = '';
    let errorLine = '';
    let errorFill = '';

    data.forEach((d, idx) => {
      const x = getX(idx);
      const latY = getLatencyY(d.latency);
      const errY = getErrorY(d.errorRate);

      if (idx === 0) {
        latencyLine = `M ${x} ${latY}`;
        latencyFill = `M ${x} ${height - padding} L ${x} ${latY}`;

        errorLine = `M ${x} ${errY}`;
        errorFill = `M ${x} ${height - padding} L ${x} ${errY}`;
      } else {
        const prevX = getX(idx - 1);
        const cpX1 = prevX + (x - prevX) / 2;
        const cpX2 = cpX1;
        
        const prevLatY = getLatencyY(data[idx - 1].latency);
        latencyLine += ` C ${cpX1} ${prevLatY}, ${cpX2} ${latY}, ${x} ${latY}`;
        latencyFill += ` C ${cpX1} ${prevLatY}, ${cpX2} ${latY}, ${x} ${latY}`;

        const prevErrY = getErrorY(data[idx - 1].errorRate);
        errorLine += ` C ${cpX1} ${prevErrY}, ${cpX2} ${errY}, ${x} ${errY}`;
        errorFill += ` C ${cpX1} ${prevErrY}, ${cpX2} ${errY}, ${x} ${errY}`;
      }

      if (idx === data.length - 1) {
        latencyFill += ` L ${x} ${height - padding} Z`;
        errorFill += ` L ${x} ${height - padding} Z`;
      }
    });

    return (
      <div className="w-full relative select-none">
        <svg
          className="w-full overflow-visible"
          viewBox={`0 0 ${width} ${height}`}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredPerfIdx(null)}
        >
          <defs>
            <linearGradient id="grad-latency" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="grad-error" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {[0, 0.5, 1].map((ratio) => {
            const y = padding + ratio * (height - padding * 2);
            return (
              <g key={ratio} className="opacity-40">
                <line
                  x1={padding}
                  y1={y}
                  x2={width - padding}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeWidth="0.75"
                  strokeDasharray="3 3"
                />
              </g>
            );
          })}

          <path d={latencyFill} fill="url(#grad-latency)" />
          <path d={errorFill} fill="url(#grad-error)" />

          <path d={latencyLine} fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" />
          <path d={errorLine} fill="none" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" />

          {hoveredPerfIdx !== null && (
            <line
              x1={getX(hoveredPerfIdx)}
              y1={padding}
              x2={getX(hoveredPerfIdx)}
              y2={height - padding}
              stroke="#cbd5e1"
              strokeWidth="1"
              strokeDasharray="2 2"
            />
          )}

          {hoveredPerfIdx !== null && (
            <>
              <circle
                cx={getX(hoveredPerfIdx)}
                cy={getLatencyY(data[hoveredPerfIdx].latency)}
                r="3.5"
                fill="#6366f1"
                stroke="#ffffff"
                strokeWidth="1.5"
              />
              <circle
                cx={getX(hoveredPerfIdx)}
                cy={getErrorY(data[hoveredPerfIdx].errorRate)}
                r="3.5"
                fill="#f43f5e"
                stroke="#ffffff"
                strokeWidth="1.5"
              />
            </>
          )}

          {data.map((d, idx) => {
            const x = getX(idx);
            const skipCount = Math.ceil(data.length / 4);
            const shouldShow = idx === 0 || idx === data.length - 1 || idx % skipCount === 0;
            if (!shouldShow) return null;

            return (
              <text
                key={idx}
                x={x}
                y={height - 8}
                fill="#94a3b8"
                fontSize="9"
                fontWeight="bold"
                textAnchor="middle"
              >
                {formatDateLabel(d.time)}
              </text>
            );
          })}
        </svg>

        {hoveredPerfIdx !== null && (
          <div className="absolute top-0 right-0 bg-slate-900/95 text-[10px] text-white p-2 rounded-xl shadow-lg border border-slate-700 flex flex-col gap-1 z-10 font-bold backdrop-blur-xs">
            <div className="text-slate-400 border-b border-slate-700 pb-1 mb-1 font-mono">
              {formatDateLabel(data[hoveredPerfIdx].time)}
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#6366f1]" />
                <span>{t('admin.latency') || 'Затримка'}:</span>
              </div>
              <span className="font-mono text-slate-300">{data[hoveredPerfIdx].latency} ms</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#f43f5e]" />
                <span>{t('admin.error_rate') || 'Помилки'}:</span>
              </div>
              <span className="font-mono text-slate-300">{data[hoveredPerfIdx].errorRate}%</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6 w-full">
        {isLoading && !stats ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-indigo-600" size={36} />
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm font-semibold">
            Failed to load platform statistics
          </div>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row gap-3.5 items-center justify-between w-full mb-10">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#0A0A0A]" size={16} />
                <input
                  type="text"
                  placeholder={t('admin.search_placeholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white border-2 border-[#0A0A0A] rounded-xl text-xs font-bold text-[#0A0A0A] placeholder-slate-400 focus:outline-none shadow-[2px_2px_0px_#0A0A0A]"
                />
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end relative">
                
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsPeriodOpen(!isPeriodOpen)}
                    className="flex items-center justify-between gap-2.5 px-4 py-2 bg-white border-2 border-[#0A0A0A] rounded-xl text-xs font-black uppercase text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-[#F2EBDD] transition-all shadow-[2px_2px_0px_#0A0A0A] min-w-[150px] cursor-pointer"
                  >
                    <span>{getPeriodLabel(period)}</span>
                    <ChevronDown size={14} className={`text-current transition-transform duration-200 ${isPeriodOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isPeriodOpen && (
                    <div className="absolute right-0 mt-1.5 w-48 bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-xl shadow-[4px_4px_0px_#0A0A0A] z-50 py-1 overflow-hidden animate-in fade-in-50 duration-150">
                      {periodOptions.map((opt) => (
                        <button
                          key={opt}
                          onClick={() => {
                            setIsPeriodOpen(false);
                            if (opt === 'custom') {
                              setTempStart(startDate.toISOString().slice(0, 16));
                              setTempEnd(endDate.toISOString().slice(0, 16));
                              setIsPickerOpen(true);
                            } else {
                              setPeriod(opt);
                            }
                          }}
                          className={`w-full text-left px-4 py-2 text-xs font-bold uppercase transition-colors cursor-pointer ${period === opt ? 'bg-[#0A0A0A] text-[#F2EBDD]' : 'text-[#0A0A0A] hover:bg-white'}`}
                        >
                          {getPeriodLabel(opt)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="relative" ref={pickerRef}>
                  <button
                    onClick={() => {
                      setTempStart(startDate.toISOString().slice(0, 16));
                      setTempEnd(endDate.toISOString().slice(0, 16));
                      setIsPickerOpen(!isPickerOpen);
                    }}
                    className="flex items-center space-x-2.5 px-4 py-2 bg-white border-2 border-[#0A0A0A] rounded-xl text-xs font-black text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-[#F2EBDD] transition-all shadow-[2px_2px_0px_#0A0A0A] cursor-pointer select-none"
                  >
                    <CalendarDays size={15} className="text-current shrink-0" />
                    <span className="font-mono">{formatDateRangeDisplay()}</span>
                  </button>

                  {isPickerOpen && (
                    <div className="absolute right-0 mt-1.5 w-72 bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-2xl shadow-[4px_4px_0px_#0A0A0A] z-50 p-4 flex flex-col gap-3.5 animate-in fade-in-50 duration-150">
                      <div className="font-['Anybody',sans-serif] text-[11px] font-black text-[#0A0A0A] uppercase tracking-wider select-none">
                        {t('admin.period_custom')}
                      </div>
                      <div className="flex flex-col gap-3 text-left">
                        <label className="flex flex-col gap-1 text-[11px] font-bold text-[#0A0A0A]">
                          {t('admin.start')}
                          <input
                            type="datetime-local"
                            value={tempStart}
                            onChange={(e) => setTempStart(e.target.value)}
                            className="px-3 py-1.5 bg-white border-2 border-[#0A0A0A] rounded-lg text-xs font-bold text-[#0A0A0A] focus:outline-none"
                          />
                        </label>
                        <label className="flex flex-col gap-1 text-[11px] font-bold text-[#0A0A0A]">
                          {t('admin.end')}
                          <input
                            type="datetime-local"
                            value={tempEnd}
                            onChange={(e) => setTempEnd(e.target.value)}
                            className="px-3 py-1.5 bg-white border-2 border-[#0A0A0A] rounded-lg text-xs font-bold text-[#0A0A0A] focus:outline-none"
                          />
                        </label>
                      </div>

                      <div className="flex items-center justify-end gap-2 border-t-2 border-[#0A0A0A] pt-3">
                        <button
                          onClick={() => setIsPickerOpen(false)}
                          className="px-3 py-1.5 text-xs font-bold text-[#0A0A0A] hover:bg-white border-2 border-transparent hover:border-[#0A0A0A] rounded-lg transition-all cursor-pointer"
                        >
                          {t('admin.cancel')}
                        </button>
                        <button
                          onClick={handleApplyCustomDates}
                          className="px-3 py-1.5 text-xs font-black uppercase text-[#F2EBDD] bg-[#0A0A0A] border-2 border-[#0A0A0A] hover:bg-[#2A2A2A] rounded-lg shadow-[2px_2px_0px_#0A0A0A] transition-all cursor-pointer"
                        >
                          {t('admin.apply')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>

            <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 ${isManager ? 'xl:grid-cols-7' : 'xl:grid-cols-8'} gap-4`}>
              <div className="bg-[#F2EBDD] border-2 border-[#0A0A0A] p-4 rounded-3xl shadow-[4px_4px_0px_#0A0A0A] flex flex-col justify-between text-[#0A0A0A]">
                <div className="flex items-center justify-between text-[#0A0A0A] mb-2">
                  <span className="text-[11px] font-black uppercase tracking-wider">{t('admin.site_owners')}</span>
                  <div className="p-1.5 rounded-xl bg-white border border-[#0A0A0A] text-[#0A0A0A]">
                    <Users size={15} />
                  </div>
                </div>
                <div className="flex items-baseline justify-between">
                  <div className="text-2xl font-black text-[#0A0A0A]">{stats?.totalOwners ?? stats?.totalUsers ?? 0}</div>
                  <span className="text-[11px] font-black text-[#0A0A0A] bg-white border border-[#0A0A0A] px-2 py-0.5 rounded-lg font-mono shrink-0">
                    {stats?.totalOwnersChange}
                  </span>
                </div>
                <div className="text-[10px] text-[#0A0A0A] font-bold flex items-center mt-2 truncate">
                  <TrendingUp size={11} className="mr-1 shrink-0" />
                  <span className="truncate">{t('admin.registered_site_users')}</span>
                </div>
              </div>

              <div className="bg-[#F2EBDD] border-2 border-[#0A0A0A] p-4 rounded-3xl shadow-[4px_4px_0px_#0A0A0A] flex flex-col justify-between text-[#0A0A0A]">
                <div className="flex items-center justify-between text-[#0A0A0A] mb-2">
                  <span className="text-[11px] font-black uppercase tracking-wider">{t('admin.active_owners')}</span>
                  <div className="p-1.5 rounded-xl bg-white border border-[#0A0A0A] text-[#0A0A0A]">
                    <Activity size={15} />
                  </div>
                </div>
                <div className="flex items-baseline justify-between">
                  <div className="text-2xl font-black text-[#0A0A0A]">{stats?.activeOwners ?? stats?.totalUsers ?? 0}</div>
                  <span className="text-[11px] font-black text-[#0A0A0A] bg-white border border-[#0A0A0A] px-2 py-0.5 rounded-lg font-mono shrink-0">
                    {stats?.activeOwnersChange}
                  </span>
                </div>
                <div className="text-[10px] text-[#0A0A0A] font-bold flex items-center mt-2 truncate">
                  <span className="truncate">{t('admin.active_site_users')}</span>
                </div>
              </div>

              <div className="bg-[#F2EBDD] border-2 border-[#0A0A0A] p-4 rounded-3xl shadow-[4px_4px_0px_#0A0A0A] flex flex-col justify-between text-[#0A0A0A]">
                <div className="flex items-center justify-between text-[#0A0A0A] mb-2">
                  <span className="text-[11px] font-black uppercase tracking-wider">{t('admin.bot_clients')}</span>
                  <div className="p-1.5 rounded-xl bg-white border border-[#0A0A0A] text-[#0A0A0A]">
                    <MessageSquare size={15} />
                  </div>
                </div>
                <div className="flex items-baseline justify-between">
                  <div className="text-2xl font-black text-[#0A0A0A]">{stats?.totalBotUsers ?? 0}</div>
                  <span className="text-[11px] font-black text-[#0A0A0A] bg-white border border-[#0A0A0A] px-2 py-0.5 rounded-lg font-mono shrink-0">
                    {stats?.totalBotUsersChange}
                  </span>
                </div>
                <div className="text-[10px] text-[#0A0A0A] font-bold flex items-center mt-2 truncate">
                  <span className="truncate">{t('admin.end_telegram_users')}</span>
                </div>
              </div>

              <div className="bg-[#F2EBDD] border-2 border-[#0A0A0A] p-4 rounded-3xl shadow-[4px_4px_0px_#0A0A0A] flex flex-col justify-between text-[#0A0A0A]">
                <div className="flex items-center justify-between text-[#0A0A0A] mb-2">
                  <span className="text-[11px] font-black uppercase tracking-wider">{t('admin.active_bots')}</span>
                  <div className="p-1.5 rounded-xl bg-white border border-[#0A0A0A] text-[#0A0A0A]">
                    <Bot size={15} />
                  </div>
                </div>
                <div className="flex items-baseline justify-between">
                  <div className="text-2xl font-black text-[#0A0A0A]">{stats?.activeBots || 0}</div>
                  <span className="text-[11px] font-black text-[#0A0A0A] bg-white border border-[#0A0A0A] px-2 py-0.5 rounded-lg font-mono shrink-0">
                    {stats?.activeBotsChange}
                  </span>
                </div>
                <div className="text-[10px] text-[#0A0A0A] font-bold flex items-center mt-2 truncate">
                  <span className="truncate">{t('admin.connected_telegram')}</span>
                </div>
              </div>

              <div className="bg-[#F2EBDD] border-2 border-[#0A0A0A] p-4 rounded-3xl shadow-[4px_4px_0px_#0A0A0A] flex flex-col justify-between text-[#0A0A0A]">
                <div className="flex items-center justify-between text-[#0A0A0A] mb-2">
                  <span className="text-[11px] font-black uppercase tracking-wider">{t('admin.total_automations')}</span>
                  <div className="p-1.5 rounded-xl bg-white border border-[#0A0A0A] text-[#0A0A0A]">
                    <Workflow size={15} />
                  </div>
                </div>
                <div className="flex items-baseline justify-between">
                  <div className="text-2xl font-black text-[#0A0A0A]">{stats?.totalAutomations || 0}</div>
                  <span className="text-[11px] font-black text-[#0A0A0A] bg-white border border-[#0A0A0A] px-2 py-0.5 rounded-lg font-mono shrink-0">
                    {stats?.totalAutomationsChange}
                  </span>
                </div>
                <div className="text-[10px] text-[#0A0A0A] font-bold flex items-center mt-2 truncate">
                  <span className="truncate">{t('admin.flow_schemas')}</span>
                </div>
              </div>

              <div className="bg-[#F2EBDD] border-2 border-[#0A0A0A] p-4 rounded-3xl shadow-[4px_4px_0px_#0A0A0A] flex flex-col justify-between text-[#0A0A0A]">
                <div className="flex items-center justify-between text-[#0A0A0A] mb-2">
                  <span className="text-[11px] font-black uppercase tracking-wider">{t('admin.messages_sent')}</span>
                  <div className="p-1.5 rounded-xl bg-white border border-[#0A0A0A] text-[#0A0A0A]">
                    <Send size={15} />
                  </div>
                </div>
                <div className="flex items-baseline justify-between">
                  <div className="text-2xl font-black text-[#0A0A0A]">{stats?.totalMessagesSent || 0}</div>
                  <span className="text-[11px] font-black text-[#0A0A0A] bg-white border border-[#0A0A0A] px-2 py-0.5 rounded-lg font-mono shrink-0">
                    {stats?.totalMessagesSentChange}
                  </span>
                </div>
                <div className="text-[10px] text-[#0A0A0A] font-bold flex items-center mt-2 truncate">
                  <span className="truncate">{t('admin.broadcasts_chats')}</span>
                </div>
              </div>

              <div className="bg-[#F2EBDD] border-2 border-[#0A0A0A] p-4 rounded-3xl shadow-[4px_4px_0px_#0A0A0A] flex flex-col justify-between text-[#0A0A0A]">
                <div className="flex items-center justify-between text-[#0A0A0A] mb-2">
                  <span className="text-[11px] font-black uppercase tracking-wider">{t('admin.active_managers')}</span>
                  <div className="p-1.5 rounded-xl bg-white border border-[#0A0A0A] text-[#0A0A0A]">
                    <UserCheck size={15} />
                  </div>
                </div>
                <div className="text-2xl font-black text-[#0A0A0A]">{stats?.activeManagers || 0}</div>
                <div className="text-[10px] text-[#0A0A0A] font-bold flex items-center mt-2 truncate">
                  <span className="truncate">{t('admin.support_staff')}</span>
                </div>
              </div>

              {!isManager && (
                <div className="bg-[#F2EBDD] border-2 border-[#0A0A0A] p-4 rounded-3xl shadow-[4px_4px_0px_#0A0A0A] flex flex-col justify-between text-[#0A0A0A]">
                  <div className="flex items-center justify-between text-[#0A0A0A] mb-2">
                    <span className="text-[11px] font-black uppercase tracking-wider">{t('admin.system_uptime')}</span>
                    <div className="p-1.5 rounded-xl bg-white border border-[#0A0A0A] text-[#0A0A0A]">
                      <Clock size={15} />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-[#0A0A0A]">{formatUptime(stats?.systemUptimeSeconds)}</div>
                  <div className="text-[10px] text-[#0A0A0A] font-bold flex items-center mt-2 truncate">
                    <span className="truncate">{t('admin.online_status')}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
              <div className="bg-[#F2EBDD] border-2 border-[#0A0A0A] p-5 rounded-3xl shadow-[4px_4px_0px_#0A0A0A] flex flex-col justify-between h-40 text-[#0A0A0A]">
                <div className="flex items-center justify-between text-[#0A0A0A] mb-2">
                  <span className="text-[11px] font-black uppercase tracking-wider">MRR</span>
                  <div className="p-1.5 rounded-xl bg-white border border-[#0A0A0A] text-[#0A0A0A]">
                    <TrendingUp size={15} />
                  </div>
                </div>
                <div>
                  <div className="flex items-baseline justify-between leading-none">
                    <div className="text-2xl font-black text-[#0A0A0A]">
                      ${(stats?.mrr ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <span className="text-[11px] font-black text-[#0A0A0A] bg-white border border-[#0A0A0A] px-2 py-0.5 rounded-lg font-mono shrink-0">
                      {stats?.mrrChange}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-700 font-bold mt-2.5">
                    {t('admin.mrr_description')}
                  </div>
                </div>
              </div>

              <div className="bg-[#F2EBDD] border-2 border-[#0A0A0A] p-5 rounded-3xl shadow-[4px_4px_0px_#0A0A0A] flex flex-col justify-between h-40 text-[#0A0A0A]">
                <div className="flex items-center justify-between text-[#0A0A0A] mb-2">
                  <span className="text-[11px] font-black uppercase tracking-wider">LTV</span>
                  <div className="p-1.5 rounded-xl bg-white border border-[#0A0A0A] text-[#0A0A0A]">
                    <DollarSign size={15} />
                  </div>
                </div>
                <div>
                  <div className="flex items-baseline justify-between leading-none">
                    <div className="text-2xl font-black text-[#0A0A0A]">
                      ${(stats?.ltv ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <span className="text-[11px] font-black text-[#0A0A0A] bg-white border border-[#0A0A0A] px-2 py-0.5 rounded-lg font-mono shrink-0">
                      {stats?.ltvChange}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-700 font-bold mt-2.5">
                    {t('admin.ltv_description')}
                  </div>
                </div>
              </div>

              <div className="bg-[#F2EBDD] border-2 border-[#0A0A0A] p-5 rounded-3xl shadow-[4px_4px_0px_#0A0A0A] flex flex-col justify-between h-40 text-[#0A0A0A]">
                <div className="flex items-center justify-between text-[#0A0A0A] mb-2">
                  <span className="text-[11px] font-black uppercase tracking-wider">
                    {t('admin.plan_distribution')}
                  </span>
                  <div className="p-1.5 rounded-xl bg-white border border-[#0A0A0A] text-[#0A0A0A]">
                    <CreditCard size={15} />
                  </div>
                </div>
                {renderPlanDoughnut(stats?.planDistribution)}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 w-full">
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

              {!isManager && (
                <div className="bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-3xl p-6 shadow-[4px_4px_0px_#0A0A0A] flex flex-col justify-between text-[#0A0A0A]">
                  <div>
                    <h3 className="font-['Anybody',sans-serif] text-base font-black uppercase text-[#0A0A0A] mb-6 flex items-center gap-2">
                      <Server size={18} className="text-[#0A0A0A]" />
                      <span>{t('admin.server_status')}</span>
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 rounded-2xl bg-white border-2 border-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A]">
                        <div className="flex items-center space-x-2 text-xs font-bold text-[#0A0A0A]">
                          <span className={`w-2.5 h-2.5 rounded-full border border-[#0A0A0A] ${stats?.serverHealth?.dbHealthy !== false ? 'bg-emerald-400' : 'bg-rose-500'}`}></span>
                          <span>PostgreSQL Database</span>
                        </div>
                        <span className={`text-[11px] font-mono font-black uppercase flex items-center ${stats?.serverHealth?.dbHealthy !== false ? 'text-emerald-700' : 'text-rose-700'}`}>
                          <CheckCircle2 size={13} className="mr-1" /> {stats?.serverHealth?.dbStatus || 'Connected'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-2xl bg-white border-2 border-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A]">
                        <div className="flex items-center space-x-2 text-xs font-bold text-[#0A0A0A]">
                          <span className={`w-2.5 h-2.5 rounded-full border border-[#0A0A0A] ${stats?.serverHealth?.telegramHealthy !== false ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
                          <span>Telegram Bot Engine</span>
                        </div>
                        <span className="text-[11px] font-mono font-black uppercase text-emerald-700 flex items-center">
                          <CheckCircle2 size={13} className="mr-1" /> {stats?.serverHealth?.telegramStatus || 'Polling Active'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-2xl bg-white border-2 border-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A]">
                        <div className="flex items-center space-x-2 text-xs font-bold text-[#0A0A0A]">
                          <span className="w-2.5 h-2.5 rounded-full border border-[#0A0A0A] bg-emerald-400"></span>
                          <span>AI Provider Pipeline</span>
                        </div>
                        <span className="text-[11px] font-mono font-black uppercase text-emerald-700 flex items-center">
                          <CheckCircle2 size={13} className="mr-1" /> {stats?.serverHealth?.aiStatus || 'Operational'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-2xl bg-white border-2 border-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A]">
                        <div className="flex items-center space-x-2 text-xs font-bold text-[#0A0A0A]">
                          <span className="w-2.5 h-2.5 rounded-full border border-[#0A0A0A] bg-emerald-400"></span>
                          <span>Broadcast Engine</span>
                        </div>
                        <span className="text-[11px] font-mono font-black uppercase text-emerald-700 flex items-center">
                          <CheckCircle2 size={13} className="mr-1" /> {stats?.serverHealth?.broadcastStatus || 'Ready'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t-2 border-[#0A0A0A] text-[11px] font-black uppercase text-[#0A0A0A] flex items-center justify-between">
                    <span>EU-Central (Frankfurt)</span>
                    <span className="font-mono text-[#0A0A0A]">v1.4.0-admin</span>
                  </div>
                </div>
              )}
            </div>

            <style>{`
              .custom-scrollbar::-webkit-scrollbar {
                width: 4px;
              }
              .custom-scrollbar::-webkit-scrollbar-track {
                background: transparent;
              }
              .custom-scrollbar::-webkit-scrollbar-thumb {
                background: #0A0A0A;
                border-radius: 4px;
              }
            `}</style>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full mt-6">
              <div className="bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-3xl p-6 shadow-[4px_4px_0px_#0A0A0A] flex flex-col justify-between text-[#0A0A0A]">
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-['Anybody',sans-serif] text-base font-black uppercase text-[#0A0A0A] flex items-center gap-2">
                      <Workflow size={18} className="text-[#0A0A0A]" />
                      <span>{t('admin.integrations_title')}</span>
                    </h3>
                    <div className="flex items-center space-x-2 text-[#0A0A0A]">
                      <button className="px-2.5 py-1 bg-white border-2 border-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-[#F2EBDD] rounded-lg text-[10px] font-black uppercase transition-all flex items-center gap-1 cursor-pointer">
                        <span>{t('admin.explore_more')}</span>
                      </button>
                    </div>
                  </div>

                  <div className="overflow-y-auto max-h-[275px] pr-1.5 custom-scrollbar">
                    <table className="w-full text-xs font-bold text-[#0A0A0A]">
                      <thead>
                        <tr className="border-b-2 border-[#0A0A0A] text-[#0A0A0A] font-black text-[10px] uppercase tracking-wider text-left sticky top-0 bg-[#F2EBDD] z-10">
                          <th className="pb-3 w-1/2 bg-[#F2EBDD] sticky top-0">{t('admin.name_col')}</th>
                          <th className="pb-3 text-right bg-[#F2EBDD] sticky top-0">{t('admin.usage_col')}</th>
                          <th className="pb-3 text-right bg-[#F2EBDD] sticky top-0">{t('admin.change_pct_col')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#0A0A0A]/20">
                        {stats?.integrationsPopularity?.map((item, idx) => {
                          return (
                            <tr key={idx} className="hover:bg-white transition-colors">
                              <td className="py-3 flex items-center space-x-2.5">
                                <span className="w-2 h-2 rounded-full border border-[#0A0A0A]" style={{ backgroundColor: idx === 0 ? '#10b981' : idx === 1 ? '#6366f1' : idx === 2 ? '#f59e0b' : idx === 3 ? '#ef4444' : '#64748b' }} />
                                <span className="text-[#0A0A0A] font-black">{item.name}</span>
                              </td>
                              <td className="py-3 text-right text-[#0A0A0A] font-mono font-black">
                                {item.count.toLocaleString()}
                              </td>
                              <td className="py-3 text-right">
                                <div className="flex flex-col items-end">
                                  <span className="font-mono font-black text-[#0A0A0A]">
                                    {item.change}
                                  </span>
                                  <span className="text-[9px] font-bold text-slate-700">
                                    {item.percentage}% {t('admin.of_total')}
                                  </span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-3xl p-6 shadow-[4px_4px_0px_#0A0A0A] flex flex-col justify-between text-[#0A0A0A]">
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-['Anybody',sans-serif] text-base font-black uppercase text-[#0A0A0A] flex items-center gap-2">
                      <Users size={18} className="text-[#0A0A0A]" />
                      <span>{t('admin.client_geo_title')}</span>
                    </h3>
                    <div className="flex items-center space-x-2 text-[#0A0A0A]">
                      <button className="px-2.5 py-1 bg-white border-2 border-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-[#F2EBDD] rounded-lg text-[10px] font-black uppercase transition-all flex items-center gap-1 cursor-pointer">
                        <span>{t('admin.explore_more')}</span>
                      </button>
                    </div>
                  </div>

                  <div className="overflow-y-auto max-h-[275px] pr-1.5 custom-scrollbar">
                    <table className="w-full text-xs font-bold text-[#0A0A0A]">
                      <thead>
                        <tr className="border-b-2 border-[#0A0A0A] text-[#0A0A0A] font-black text-[10px] uppercase tracking-wider text-left sticky top-0 bg-[#F2EBDD] z-10">
                          <th className="pb-3 w-1/2 bg-[#F2EBDD] sticky top-0">{t('admin.country_col')}</th>
                          <th className="pb-3 text-right bg-[#F2EBDD] sticky top-0">{t('admin.subscribers_col')}</th>
                          <th className="pb-3 text-right bg-[#F2EBDD] sticky top-0">{t('admin.change_pct_col')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#0A0A0A]/20">
                        {stats?.geographyAndLanguages?.map((item, idx) => {
                          const countryNameMap: Record<string, string> = {
                            'Ukraine': t('admin.country_ukraine'),
                            'United States': t('admin.country_usa'),
                            'Poland': t('admin.country_poland'),
                            'Germany': t('admin.country_germany'),
                            'Other': t('admin.country_other'),
                          };
                          return (
                            <tr key={idx} className="hover:bg-white transition-colors">
                              <td className="py-3 flex items-center space-x-2.5">
                                <span className="w-2 h-2 rounded-full border border-[#0A0A0A]" style={{ backgroundColor: item.name === 'Ukraine' ? '#0284c7' : item.name === 'United States' ? '#ef4444' : item.name === 'Poland' ? '#d946ef' : item.name === 'Germany' ? '#10b981' : '#64748b' }} />
                                <span className="text-[#0A0A0A] font-black">
                                  {countryNameMap[item.name] || item.name}
                                </span>
                              </td>
                              <td className="py-3 text-right text-[#0A0A0A] font-mono font-black">
                                {item.count.toLocaleString()}
                              </td>
                              <td className="py-3 text-right">
                                <div className="flex flex-col items-end">
                                  <span className="font-mono font-black text-[#0A0A0A]">
                                    {item.change}
                                  </span>
                                  <span className="text-[9px] font-bold text-slate-700">
                                    {item.percentage}% {t('admin.of_total')}
                                  </span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {!isManager && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full mt-6">
                <div className="lg:col-span-2 bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-3xl p-6 shadow-[4px_4px_0px_#0A0A0A] flex flex-col justify-between text-[#0A0A0A]">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-['Anybody',sans-serif] text-base font-black uppercase text-[#0A0A0A] flex items-center gap-2">
                        <Activity size={18} className="text-[#0A0A0A] animate-pulse" />
                        <span>{t('admin.error_latency_title').replace(/\s*\(.*\)/g, '')}</span>
                      </h3>
                      <div className="flex items-center gap-3.5 text-[10px] font-bold text-[#0A0A0A]">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#6366f1] border border-[#0A0A0A]" />
                          <span>{t('admin.latency') || 'Затримка'} (ms)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#f43f5e] border border-[#0A0A0A]" />
                          <span>{t('admin.error_rate') || 'Помилки'} (%)</span>
                        </div>
                      </div>
                    </div>
                    {renderPerformanceChart()}
                  </div>
                </div>

                <div className="bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-3xl p-6 shadow-[4px_4px_0px_#0A0A0A] flex flex-col justify-between text-[#0A0A0A]">
                  <div className="flex flex-col h-full justify-between">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-['Anybody',sans-serif] text-base font-black uppercase text-[#0A0A0A] flex items-center gap-2">
                        <MessageSquare size={18} className="text-[#0A0A0A]" />
                        <span>{t('admin.latest_logs_title')}</span>
                      </h3>
                      <button
                        onClick={() => navigate('/admin/logs')}
                        className="px-2.5 py-1 bg-white border-2 border-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-[#F2EBDD] rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer"
                      >
                        {t('admin.explore_more')}
                      </button>
                    </div>
                    <div className="flex-1 bg-white border-2 border-[#0A0A0A] rounded-2xl p-4 font-mono text-[10.5px] text-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A] max-h-[210px] overflow-y-auto custom-scrollbar flex flex-col gap-2">
                      {(!stats?.latestLogs || stats.latestLogs.length === 0) ? (
                        <div className="flex items-center justify-center h-full text-slate-700 font-bold py-10">
                          No system logs found
                        </div>
                      ) : (
                        stats.latestLogs.map((log, idx) => {
                          const isError = log.level === 'ERROR';
                          const isWarn = log.level === 'WARN';
                          const timeStr = log.timestamp ? log.timestamp.split('T')[1]?.substring(0, 8) || '' : '';
                          return (
                            <div key={idx} className="flex items-start gap-2 hover:bg-[#F2EBDD] p-2 rounded-xl border border-[#0A0A0A] transition-all bg-white">
                              <span className="text-slate-700 shrink-0 select-none font-bold">[{timeStr}]</span>
                              <span className={`shrink-0 select-none text-[9px] px-1.5 py-0.5 rounded-md font-black border border-[#0A0A0A] uppercase ${
                                isError ? 'bg-rose-200 text-rose-950' : 
                                isWarn ? 'bg-amber-200 text-amber-950' : 
                                'bg-emerald-200 text-emerald-950'
                              }`}>
                                {log.level}
                              </span>
                              <span className="bg-[#F2EBDD] text-[#0A0A0A] text-[9px] px-1.5 py-0.5 rounded-md font-black uppercase border border-[#0A0A0A] shrink-0 select-none">
                                {log.service}
                              </span>
                              <span className="text-[#0A0A0A] break-all font-bold">{log.message}</span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminStatsPage;
