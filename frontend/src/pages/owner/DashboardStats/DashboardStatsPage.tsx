import React, { useState } from 'react';
import { useClickOutside } from '../../../hooks/useClickOutside';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../../components/layout/DashboardLayout';
import { ErrorBoundary } from '../../../components/common/ErrorBoundary';
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
  HelpCircle,
  Plus
} from 'lucide-react';
import { MiniBarChart, SemiDonutChart, ActivityAreaChart } from '../../../components/charts';
import { AiStatsCard } from './components/AiStatsCard';
import { StatCardTooltip } from './components/StatCardTooltip';

export const DashboardStatsPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [selectedBotId, setSelectedBotId] = useState<number>(0);
  const [days, setDays] = useState<number>(7);
  const [isBotSelectorOpen, setIsBotSelectorOpen] = useState(false);
  const { data: bots = [], isLoading: isBotsLoading } = useBotsQuery();
  const { data: stats, isLoading, error } = useDashboardStatsQuery(selectedBotId, days, true);
  const connectedBots = React.useMemo(() => bots.filter((b) => b.hasTelegramToken), [bots]);

  const botSelectorRef = React.useRef<HTMLDivElement>(null);

  useClickOutside(botSelectorRef, () => setIsBotSelectorOpen(false), isBotSelectorOpen);

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
    if (!stats || !stats.dailyStats || stats.dailyStats.length === 0) return [0, 0, 0, 0, 0, 0];
    const data = stats.dailyStats.slice(-6).map((d) => d.activeUsers + d.clicks);
    while (data.length < 6) {
      data.unshift(0);
    }
    return data;
  }, [stats]);

  const last6DaysActiveUsers = React.useMemo(() => {
    if (!stats || !stats.dailyStats || stats.dailyStats.length === 0) return [0, 0, 0, 0, 0, 0];
    const data = stats.dailyStats.slice(-6).map((d) => d.activeUsers);
    while (data.length < 6) {
      data.unshift(0);
    }
    return data;
  }, [stats]);

  const last6DaysClicks = React.useMemo(() => {
    if (!stats || !stats.dailyStats || stats.dailyStats.length === 0) return [0, 0, 0, 0, 0, 0];
    const data = stats.dailyStats.slice(-6).map((d) => d.clicks);
    while (data.length < 6) {
      data.unshift(0);
    }
    return data;
  }, [stats]);

  const last6DaysActiveBots = React.useMemo(() => {
    if (!stats || !stats.dailyStats || stats.dailyStats.length === 0) return [0, 0, 0, 0, 0, 0];
    const data = stats.dailyStats.slice(-6).map((d) => (d.activeUsers > 0 || d.clicks > 0 ? (stats?.activeAutomations || 0) : 0));
    while (data.length < 6) {
      data.unshift(0);
    }
    return data;
  }, [stats]);

  const chartData = React.useMemo(() => {
    const totalSub = stats?.totalSubscribers ?? 0;
    const colors = ['#0A0A0A', '#404040', '#737373', '#A3A3A3', '#D4D4D4'];
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

  const activityData = React.useMemo(() => {
    if (!stats) return [];

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
    return data;
  }, [stats, days]);

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
                      const backgroundColor = count > 0 ? `rgba(10, 10, 10, ${opacity})` : '#e2e8f0';

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
            <div className="w-2.5 h-2.5 bg-[#0A0A0A]/30 border border-[#0A0A0A]/30 rounded-sm" />
            <div className="w-2.5 h-2.5 bg-[#0A0A0A]/60 border border-[#0A0A0A]/30 rounded-sm" />
            <div className="w-2.5 h-2.5 bg-[#0A0A0A] border border-[#0A0A0A]/30 rounded-sm" />
            <span>{t('dashboard.stats.heatmap.more')}</span>
          </div>
        </div>
      </div>
    );
  };

  const hasNoBots = !isBotsLoading && connectedBots.length === 0;
  const isMultipleBots = connectedBots.length > 1;

  return (
    <DashboardLayout>
      <div className="flex flex-col bg-[#F2EBDD] font-['Geist',sans-serif] min-h-full pb-6">
        
        <header className="h-16 border-b-2 border-[#0A0A0A] px-6 flex justify-between items-center bg-[#F2EBDD] shrink-0 z-20">
          <h1 className="font-['Anybody',sans-serif] text-2xl font-black text-[#0A0A0A] uppercase tracking-tight select-none">
            {t('dashboard.stats.title')}
          </h1>

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
          ) : (isLoading || isBotsLoading) ? (
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

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

                <div className="bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-3xl p-5 relative overflow-visible flex flex-col justify-between group select-none min-h-[150px]">
                  <div className="flex justify-between items-start">
                    <span className="font-['JetBrains_Mono',monospace] text-[10px] font-black text-[#0A0A0A]/70 uppercase tracking-widest block">{t('dashboard.stats.total_subscribers')}</span>
                    <StatCardTooltip text={t('dashboard.stats.tooltip.total_subscribers')} />
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

                <div className="bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-3xl p-5 relative overflow-visible flex flex-col justify-between group select-none min-h-[150px]">
                  <div className="flex justify-between items-start">
                    <span className="font-['JetBrains_Mono',monospace] text-[10px] font-black text-[#0A0A0A]/70 uppercase tracking-widest block">{t('dashboard.stats.active_users')}</span>
                    <StatCardTooltip text={t('dashboard.stats.tooltip.active_users')} />
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

                <div className="bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-3xl p-5 relative overflow-visible flex flex-col justify-between group select-none min-h-[150px]">
                  <div className="flex justify-between items-start">
                    <span className="font-['JetBrains_Mono',monospace] text-[10px] font-black text-[#0A0A0A]/70 uppercase tracking-widest block">{t('dashboard.stats.total_clicks')}</span>
                    <StatCardTooltip text={t('dashboard.stats.tooltip.total_clicks')} />
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

                <div className="bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-3xl p-5 relative overflow-visible flex flex-col justify-between group select-none min-h-[150px]">
                  <div className="flex justify-between items-start">
                    <span className="font-['JetBrains_Mono',monospace] text-[10px] font-black text-[#0A0A0A]/70 uppercase tracking-widest block">{t('dashboard.stats.active_automations')}</span>
                    <StatCardTooltip text={t('dashboard.stats.tooltip.active_automations')} />
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

              <ErrorBoundary inline fallbackTitle="Analytics Charts Error" fallbackDescription="Unable to render analytics charts. Please try refreshing.">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                <div className="lg:col-span-2 bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-2xl p-5 flex flex-col justify-between lg:h-[310px] overflow-visible relative">
                  <div className="flex flex-row justify-between items-center mb-4 select-none font-['JetBrains_Mono',monospace]">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h2 className="font-['Anybody',sans-serif] text-xs font-black text-[#0A0A0A] uppercase tracking-widest">{t('dashboard.stats.interaction_history')}</h2>
                        <StatCardTooltip text={t('dashboard.stats.tooltip.interaction_history')} />
                      </div>
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
                          className={`px-3 py-1 text-[10px] font-extrabold uppercase transition-all cursor-pointer rounded-lg ${
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
                  <ActivityAreaChart data={activityData} isLoaded={Boolean(stats)} />
                </div>

                <div className="bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-2xl p-5 flex flex-col lg:h-[310px] overflow-visible relative">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="font-['Anybody',sans-serif] text-xs font-black text-[#0A0A0A] uppercase tracking-widest">{t('dashboard.stats.top_clicked_buttons')}</h2>
                      <p className="font-['JetBrains_Mono',monospace] text-[10px] text-slate-700 mt-1 uppercase">{t('dashboard.stats.top_clicked_buttons_desc')}</p>
                    </div>
                    <StatCardTooltip text={t('dashboard.stats.tooltip.top_clicked_buttons')} />
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
                                  <span className="text-[#0A0A0A] font-black">{pct}%</span>
                                </span>
                              </div>
                              <div className="w-full h-2 bg-white border border-[#0A0A0A] overflow-hidden">
                                <div 
                                  className="h-full bg-[#0A0A0A] transition-all duration-500 ease-out" 
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

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
                <AiStatsCard stats={aiStats} />

                <div className="bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-2xl p-5 flex flex-col justify-between lg:col-span-3 lg:h-[275px] overflow-visible relative">
                  <div>
                    <div className="flex justify-between items-start mb-1">
                      <div>
                        <h2 className="font-['Anybody',sans-serif] text-xs font-black text-[#0A0A0A] uppercase tracking-widest block select-none">{t('dashboard.stats.tags_breakdown_title')}</h2>
                        <p className="font-['JetBrains_Mono',monospace] text-[10px] text-slate-700 mb-3 mt-0.5 uppercase">{t('dashboard.stats.tags_breakdown_desc')}</p>
                      </div>
                      <StatCardTooltip text={t('dashboard.stats.tooltip.tags_breakdown')} />
                    </div>
                    
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

                <div className="bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-2xl p-5 flex flex-col justify-between h-full lg:col-span-6 lg:h-[275px] overflow-visible relative">
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h2 className="font-['Anybody',sans-serif] text-xs font-black text-[#0A0A0A] uppercase tracking-widest block mb-1">{t('dashboard.stats.activity_heatmap_title')}</h2>
                        <p className="font-['JetBrains_Mono',monospace] text-[10px] text-slate-700 mt-0.5 uppercase">{t('dashboard.stats.activity_heatmap_desc')}</p>
                      </div>
                      <StatCardTooltip text={t('dashboard.stats.tooltip.activity_heatmap')} />
                    </div>
                    {renderActivityHeatmap()}
                  </div>
                </div>

              </div>
              </ErrorBoundary>

            </div>
          )}
        </div>

      </div>
    </DashboardLayout>
  );
};

export default DashboardStatsPage;
