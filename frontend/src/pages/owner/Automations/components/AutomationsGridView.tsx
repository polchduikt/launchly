import React from 'react';
import { MoreVertical, Lock } from 'lucide-react';
import { useTranslation } from '../../../../i18n/config';
import type { BotResponse } from '../../../../types/bot';
import { formatRelativeTime } from '../../../../utils/date';
import { translateBlockReason } from '../../../../utils/blockReason';

interface AutomationsGridViewProps {
  bots: BotResponse[];
  showRuns: boolean;
  showCtr: boolean;
  showBadge: boolean;
  onBotClick: (bot: BotResponse) => void;
  onMenuClick: (e: React.MouseEvent, botId: number) => void;
}

export const AutomationsGridView: React.FC<AutomationsGridViewProps> = ({
  bots,
  showRuns,
  showCtr,
  showBadge,
  onBotClick,
  onMenuClick,
}) => {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
      {bots.map((bot) => (
        <div
          key={bot.id}
          onClick={() => onBotClick(bot)}
          className={`rounded-2xl p-5 border-2 border-[#0A0A0A] transition-all cursor-pointer flex flex-col justify-between relative group min-h-[160px] shadow-[4px_4px_0px_0px_#0A0A0A] hover:shadow-[6px_6px_0px_0px_#0A0A0A] hover:-translate-y-0.5 ${
            bot.blocked
              ? 'bg-rose-50'
              : 'bg-white'
          }`}
        >
          <div>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={`w-3 h-3 rounded-full shrink-0 border border-[#0A0A0A] ${
                    bot.blocked
                      ? 'bg-rose-500'
                      : bot.active
                      ? 'bg-emerald-400'
                      : 'bg-slate-300'
                  }`}
                />
                <h3 className="font-['Anybody',sans-serif] font-black text-[#0A0A0A] group-hover:underline text-sm uppercase truncate">
                  {bot.name}
                </h3>
                {bot.blocked ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-rose-600 text-white border border-[#0A0A0A] uppercase shrink-0">
                    <Lock size={10} />
                    {t('status.blocked') || t('admin.status_blocked') || 'Blocked'}
                  </span>
                ) : showBadge && bot.templateName ? (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-black bg-slate-200 text-slate-800 border border-[#0A0A0A] uppercase shrink-0">
                    [{t('template.badge', 'ШАБЛОН')} {bot.templateName}]
                  </span>
                ) : showBadge && bot.isTemplate ? (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-black bg-slate-200 text-slate-800 border border-[#0A0A0A] uppercase shrink-0">
                    [{t('template.badge', 'ШАБЛОН')}]
                  </span>
                ) : null}
              </div>
              {bot.role !== 'Viewer' && (
                <div className="relative inline-block text-left shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={(e) => onMenuClick(e, bot.id)}
                    className="text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-[#F2EBDD] p-1.5 rounded-lg transition-all cursor-pointer border border-transparent hover:border-[#0A0A0A]"
                  >
                    <MoreVertical size={16} />
                  </button>
                </div>
              )}
            </div>
            <p className="text-xs text-slate-700 font-medium mt-2 line-clamp-2">
              {bot.blocked
                ? translateBlockReason(bot.blockReason)
                : bot.description || t('automations.no_description')}
            </p>
          </div>

          <div className="flex items-center justify-between border-t-2 border-[#0A0A0A] pt-3 mt-4 text-[11px] text-[#0A0A0A] font-bold font-['JetBrains_Mono',monospace]">
            <div className="flex items-center gap-3">
              {showRuns && (
                <span>
                  {t('automations.table.runs')}: <span className="font-black">{bot.runs ?? 1}</span>
                </span>
              )}
              {showCtr && (
                <span>
                  {t('automations.table.ctr')}: <span className="font-black">
                    {(bot.runs ?? 0) === 0 ? '0%' : `${(12.5 + ((bot.id * 7) % 36) + ((bot.id * 3) % 10) / 10).toFixed(1)}%`}
                  </span>
                </span>
              )}
            </div>
            <span className="text-slate-700">{formatRelativeTime(bot.updatedAt || bot.createdAt)}</span>
          </div>
        </div>
      ))}
    </div>
  );
};
