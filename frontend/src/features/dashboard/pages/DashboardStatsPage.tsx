import React, { useState } from 'react';
import { DashboardLayout } from '../../../components/layouts/DashboardLayout';
import { useDashboardStatsQuery } from '../hooks/useDashboardStatsQuery';
import { useBotsQuery } from '../../bot/hooks/useBotsQuery';
import { t } from '../../../i18n';
import { 
  Users, 
  Activity, 
  MousePointer, 
  Zap, 
  Loader2, 
  AlertCircle, 
  TrendingUp, 
  ChevronDown,
  MessageSquare
} from 'lucide-react';

export const DashboardStatsPage: React.FC = () => {
  const [selectedBotId, setSelectedBotId] = useState<number>(0);
  const [days, setDays] = useState<number>(7);
  const [isBotSelectorOpen, setIsBotSelectorOpen] = useState(false);
  const { data: bots = [] } = useBotsQuery();
  const { data: stats, isLoading, error } = useDashboardStatsQuery(selectedBotId, days, true);

  const connectedBots = React.useMemo(() => bots.filter((b) => b.hasTelegramToken), [bots]);

  React.useEffect(() => {
    if (connectedBots.length === 1 && selectedBotId === 0) {
      setSelectedBotId(connectedBots[0].id);
    }
  }, [connectedBots, selectedBotId]);

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
    const height = 280;
    const padding = 40;

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
      <div className="w-full overflow-x-auto">
        <svg className="w-full min-w-[650px]" viewBox={`0 0 ${width} ${height}`}>
          <defs>
            <linearGradient id="usersGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#818cf8" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#818cf8" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="clicksGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#34d399" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#34d399" stopOpacity="0.0" />
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
                  stroke="#e2e8f0"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
                <text
                  x={padding - 10}
                  y={y + 4}
                  fill="#94a3b8"
                  fontSize="9.5"
                  fontWeight="bold"
                  textAnchor="end"
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
            stroke="#818cf8"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d={clicksPath}
            fill="none"
            stroke="#34d399"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {data.map((d, idx) => {
            const x = getX(idx);
            const yUsers = getY(d.activeUsers);
            const yClicks = getY(d.clicks);

            return (
              <g key={idx}>
                <circle
                  cx={x}
                  cy={yUsers}
                  r="4.5"
                  fill="#ffffff"
                  stroke="#818cf8"
                  strokeWidth="2.5"
                />
                <circle
                  cx={x}
                  cy={yClicks}
                  r="4.5"
                  fill="#ffffff"
                  stroke="#34d399"
                  strokeWidth="2.5"
                />
              </g>
            );
          })}

          {data.map((d, idx) => {
            if (data.length > 12 && idx % 2 !== 0) return null;
            const x = getX(idx);
            const dateParts = d.date.split('-');
            const labelStr = dateParts.length >= 3 ? `${dateParts[2]}.${dateParts[1]}` : d.date;

            return (
              <text
                key={idx}
                x={x}
                y={height - 12}
                fill="#94a3b8"
                fontSize="9.5"
                fontWeight="bold"
                textAnchor="middle"
              >
                {labelStr}
              </text>
            );
          })}
        </svg>
      </div>
    );
  };

  const hasNoBots = connectedBots.length === 0;
  const isMultipleBots = connectedBots.length > 1;

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-4rem)] flex flex-col bg-slate-50 font-sans overflow-hidden">
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-row justify-between items-center gap-4 shrink-0 shadow-xs z-20">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2 select-none">
              <TrendingUp size={20} className="text-indigo-600" />
              <span>{t('dashboard.stats.title')}</span>
            </h1>
            <p className="text-xs text-slate-400">{t('dashboard.stats.subtitle')}</p>
          </div>
          {connectedBots.length > 0 && (
            <div className="relative">
              <button
                onClick={() => {
                  if (isMultipleBots) {
                    setIsBotSelectorOpen(!isBotSelectorOpen);
                  }
                }}
                className={`flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 text-xs font-bold transition-all shadow-3xs select-none min-w-[180px] justify-between ${
                  isMultipleBots ? 'hover:border-slate-350 cursor-pointer' : 'cursor-default'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <MessageSquare size={14} className="text-indigo-500 shrink-0" />
                  <span className="truncate">
                    {selectedBotId === 0 ? t('dashboard.stats.all_automation') : (currentBot ? currentBot.name : t('dashboard.stats.select_bot'))}
                  </span>
                </div>
                {isMultipleBots && <ChevronDown size={14} className="text-slate-400 shrink-0" />}
              </button>

              {isBotSelectorOpen && isMultipleBots && (
                <div className="absolute right-0 mt-1.5 w-60 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-35 max-h-60 overflow-y-auto">
                  <button
                    onClick={() => handleBotChange(0)}
                    className={`w-full text-left px-4 py-2.5 text-xs font-bold transition-colors cursor-pointer block truncate ${
                      selectedBotId === 0
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-slate-655 hover:bg-slate-50 hover:text-slate-900'
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
                          ? 'bg-indigo-50 text-indigo-700'
                          : 'text-slate-655 hover:bg-slate-50 hover:text-slate-900'
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

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {hasNoBots ? (
            <div className="h-full flex items-center justify-center p-8 text-center bg-white border border-slate-200 rounded-3xl shadow-sm">
              <div className="max-w-md space-y-3.5">
                <AlertCircle size={44} className="text-slate-350 mx-auto animate-pulse" />
                <p className="font-extrabold text-slate-700 text-base">{t('dashboard.stats.no_bot_title')}</p>
                <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                  {t('dashboard.stats.no_bot_desc')}
                </p>
              </div>
            </div>
          ) : isLoading ? (
            <div className="h-96 flex flex-col items-center justify-center gap-3">
              <Loader2 className="animate-spin text-indigo-600" size={32} />
              <span className="text-xs font-bold text-slate-400">{t('dashboard.stats.loading')}</span>
            </div>
          ) : error ? (
            <div className="p-6 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-700 text-xs font-semibold">
              <AlertCircle size={18} className="shrink-0" />
              <span>{t('dashboard.stats.error')}: {error.message}</span>
            </div>
          ) : (
            <div className="space-y-6 w-full pb-10">

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

                <div className="bg-gradient-to-tr from-white to-slate-50/50 border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all rounded-3xl p-5 relative overflow-hidden group select-none shadow-3xs">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">{t('dashboard.stats.total_subscribers')}</span>
                      <span className="text-2xl font-black text-slate-900 tracking-tight block">
                        {stats?.totalSubscribers ?? 0}
                      </span>
                    </div>
                    <span className="w-9 h-9 rounded-xl bg-indigo-550/10 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Users size={16} />
                    </span>
                  </div>
                  <div className="mt-4 flex items-center gap-1 text-[10px] font-bold text-indigo-650 bg-indigo-50/40 px-2 py-0.5 rounded-lg w-fit">
                    <span>{t('dashboard.stats.lifetime_total')}</span>
                  </div>
                </div>

                <div className="bg-gradient-to-tr from-white to-slate-50/50 border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all rounded-3xl p-5 relative overflow-hidden group select-none shadow-3xs">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">{t('dashboard.stats.active_users')}</span>
                      <span className="text-2xl font-black text-slate-900 tracking-tight block">
                        {stats?.activeUsers24h ?? 0}
                      </span>
                    </div>
                    <span className="w-9 h-9 rounded-xl bg-violet-50 text-violet-500 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Activity size={16} />
                    </span>
                  </div>
                  <div className="mt-4 flex items-center gap-1 text-[10px] font-bold text-violet-650 bg-violet-50/40 px-2 py-0.5 rounded-lg w-fit">
                    <span>{t('dashboard.stats.unique_visitors')}</span>
                  </div>
                </div>

                <div className="bg-gradient-to-tr from-white to-slate-50/50 border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all rounded-3xl p-5 relative overflow-hidden group select-none shadow-3xs">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">{t('dashboard.stats.total_clicks')}</span>
                      <span className="text-2xl font-black text-slate-900 tracking-tight block">
                        {stats?.clicksCount30d ?? 0}
                      </span>
                    </div>
                    <span className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <MousePointer size={16} />
                    </span>
                  </div>
                  <div className="mt-4 flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50/40 px-2 py-0.5 rounded-lg w-fit">
                    <span>{t('dashboard.stats.interaction_counts')}</span>
                  </div>
                </div>

                <div className="bg-gradient-to-tr from-white to-slate-50/50 border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all rounded-3xl p-5 relative overflow-hidden group select-none shadow-3xs">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">{t('dashboard.stats.active_automations')}</span>
                      <span className="text-2xl font-black text-slate-900 tracking-tight block">
                        {stats?.activeAutomations ?? 0}
                      </span>
                    </div>
                    <span className="w-9 h-9 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Zap size={16} />
                    </span>
                  </div>
                  <div className="mt-4 flex items-center gap-1 text-[10px] font-bold text-amber-650 bg-amber-50/40 px-2 py-0.5 rounded-lg w-fit">
                    <span>{t('dashboard.stats.active_bots_count')}</span>
                  </div>
                </div>

              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-3xs flex flex-col justify-between">
                  <div className="flex flex-row justify-between items-center mb-6 select-none">
                    <div className="space-y-1">
                      <h2 className="font-extrabold text-slate-800 text-sm">{t('dashboard.stats.interaction_history')}</h2>
                      <div className="flex items-center gap-3 text-[10px] font-bold">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
                          <span className="text-slate-500">{t('dashboard.stats.active_users_legend')}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                          <span className="text-slate-500">{t('dashboard.stats.button_clicks_legend')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-3xs shrink-0">
                      {[
                        { label: t('dashboard.stats.days_7'), val: 7 },
                        { label: t('dashboard.stats.days_14'), val: 14 },
                        { label: t('dashboard.stats.days_30'), val: 30 },
                      ].map((p) => (
                        <button
                          key={p.val}
                          onClick={() => handlePeriodChange(p.val)}
                          className={`px-2.5 py-1 text-[10px] font-extrabold rounded-lg transition-all cursor-pointer ${
                            days === p.val
                              ? 'bg-white text-slate-800 shadow-2xs'
                              : 'text-slate-550 hover:text-slate-800'
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  {renderActivityChart()}
                </div>


                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-3xs flex flex-col">
                  <div className="mb-4">
                    <h2 className="font-extrabold text-slate-800 text-sm">{t('dashboard.stats.top_clicked_buttons')}</h2>
                    <p className="text-[10px] text-slate-400">{t('dashboard.stats.top_clicked_buttons_desc')}</p>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 select-none">
                    {!stats || !stats.topButtons || stats.topButtons.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-center p-6 text-slate-400 text-xs font-semibold">
                        {t('dashboard.stats.no_buttons')}
                      </div>
                    ) : (
                      stats.topButtons.map((btn, idx) => {
                        const total = Math.max(...stats.topButtons.map(b => b.clicks), 1);
                        const pct = Math.round((btn.clicks / total) * 100);

                        return (
                          <div key={idx} className="space-y-1.5">
                            <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                              <span className="truncate max-w-[170px]">{btn.buttonName || t('dashboard.stats.option_button')}</span>
                              <span className="text-[10.5px] text-slate-400 font-extrabold">
                                {t('dashboard.stats.clicks_count', { count: btn.clicks })}
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-indigo-500 rounded-full transition-all duration-500 ease-out" 
                                style={{ width: `${pct}%` }} 
                              />
                            </div>
                          </div>
                        );
                      })
                    )}
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
