import React from 'react';
import { Clock } from 'lucide-react';
import { AiIcon } from '../../../../components/ui/AiIcon';
import { useTranslation } from '../../../../i18n/config';
import { StatCardTooltip } from './StatCardTooltip';

export interface AiStats {
  messagesProcessed: number;
  resolutionRate: number;
  timeSavedHours: number;
  responseTimeSeconds: number;
}

export interface AiStatsCardProps {
  stats: AiStats;
}

export const AiStatsCard: React.FC<AiStatsCardProps> = ({ stats }) => {
  const { t } = useTranslation();

  return (
    <div className="bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-2xl p-5 flex flex-col justify-between lg:col-span-3 lg:h-[275px] relative overflow-visible">
      <div>
        <div className="flex justify-between items-start mb-1">
          <div>
            <h2 className="font-['Anybody',sans-serif] text-xs font-black text-[#0A0A0A] uppercase tracking-widest block mb-1">
              {t('dashboard.stats.ai_insights_title')}
            </h2>
            <p className="font-['JetBrains_Mono',monospace] text-[10px] text-slate-700 mb-3 mt-0.5 uppercase">
              {t('dashboard.stats.ai_insights_desc')}
            </p>
          </div>
          <StatCardTooltip text={t('dashboard.stats.tooltip.ai_insights')} />
        </div>

        <div className="grid grid-cols-2 gap-2.5 font-['JetBrains_Mono',monospace]">
          <div className="p-2.5 bg-white border-2 border-[#0A0A0A] rounded-xl flex flex-col justify-center min-h-[56px]">
            <span className="text-[9px] font-black text-[#0A0A0A]/70 uppercase tracking-wider block mb-0.5">
              {t('dashboard.stats.ai_messages')}
            </span>
            <span className="text-base font-black text-[#0A0A0A] flex items-center gap-1.5">
              <AiIcon size={13} className="text-indigo-600" />
              {stats.messagesProcessed}
            </span>
          </div>

          <div className="p-2.5 bg-white border-2 border-[#0A0A0A] rounded-xl flex flex-col justify-center min-h-[56px]">
            <span className="text-[9px] font-black text-[#0A0A0A]/70 uppercase tracking-wider block mb-0.5">
              {t('dashboard.stats.ai_resolution_rate')}
            </span>
            <span className="text-base font-black text-[#0A0A0A]">{stats.resolutionRate}%</span>
          </div>

          <div className="p-2.5 bg-white border-2 border-[#0A0A0A] rounded-xl flex flex-col justify-center min-h-[56px]">
            <span className="text-[9px] font-black text-[#0A0A0A]/70 uppercase tracking-wider block mb-0.5">
              {t('dashboard.stats.ai_time_saved')}
            </span>
            <span className="text-base font-black text-emerald-700 flex items-center gap-1.5">
              <Clock size={13} className="text-emerald-600" />
              {stats.timeSavedHours}h
            </span>
          </div>

          <div className="p-2.5 bg-white border-2 border-[#0A0A0A] rounded-xl flex flex-col justify-center min-h-[56px]">
            <span className="text-[9px] font-black text-[#0A0A0A]/70 uppercase tracking-wider block mb-0.5">
              {t('dashboard.stats.ai_response_time')}
            </span>
            <span className="text-base font-black text-[#0A0A0A]">{stats.responseTimeSeconds}s</span>
          </div>
        </div>
      </div>
    </div>
  );
};
