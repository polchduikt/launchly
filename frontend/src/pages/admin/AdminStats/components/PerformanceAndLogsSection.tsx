import React, { useState } from 'react';
import { Activity, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation, getLanguage } from '../../../../i18n/config';
import type { AdminStats } from '../../../../api/admin';

interface PerformanceAndLogsSectionProps {
  stats: AdminStats | undefined;
}

export const PerformanceAndLogsSection: React.FC<PerformanceAndLogsSectionProps> = ({ stats }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [hoveredPerfIdx, setHoveredPerfIdx] = useState<number | null>(null);

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
  );
};
