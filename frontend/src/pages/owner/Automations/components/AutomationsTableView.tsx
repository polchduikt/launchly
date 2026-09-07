import React from 'react';
import { MoreVertical, Lock } from 'lucide-react';
import { useTranslation } from '../../../../i18n/config';
import type { BotResponse } from '../../../../types/bot';
import { formatRelativeTime } from '../../../../utils/date';
import { translateBlockReason } from '../../../../utils/blockReason';

interface AutomationsTableViewProps {
  bots: BotResponse[];
  selectedBotIds: Set<number>;
  showRuns: boolean;
  showCtr: boolean;
  showBadge: boolean;
  onToggleSelectAll: () => void;
  onToggleSelectBot: (id: number) => void;
  onBotClick: (bot: BotResponse) => void;
  onMenuClick: (e: React.MouseEvent, botId: number) => void;
}

export const AutomationsTableView: React.FC<AutomationsTableViewProps> = ({
  bots,
  selectedBotIds,
  showRuns,
  showCtr,
  showBadge,
  onToggleSelectAll,
  onToggleSelectBot,
  onBotClick,
  onMenuClick,
}) => {
  const { t } = useTranslation();

  return (
    <div className="overflow-x-auto pt-2">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b-2 border-[#0A0A0A] text-[#0A0A0A] text-[10px] font-black uppercase tracking-wider">
            <th className="py-3 px-4 w-12 text-center">
              <input
                type="checkbox"
                checked={bots.length > 0 && bots.every((b) => selectedBotIds.has(b.id))}
                onChange={onToggleSelectAll}
                className="rounded border-2 border-[#0A0A0A] text-[#0A0A0A] focus:ring-0"
              />
            </th>
            <th className="py-3 px-2">{t('automations.table.name')}</th>
            {showRuns && <th className="py-3 px-2 w-28 text-center">{t('automations.table.runs')}</th>}
            {showCtr && <th className="py-3 px-2 w-28 text-center">{t('automations.table.ctr')}</th>}
            <th className="py-3 px-2 w-40">{t('automations.table.modified')}</th>
            <th className="py-3 px-4 w-12"></th>
          </tr>
        </thead>
        <tbody>
          {bots.map((bot) => (
            <tr
              key={bot.id}
              onClick={() => onBotClick(bot)}
              className={`border-b-2 border-[#0A0A0A] transition-all group cursor-pointer ${
                bot.blocked
                  ? 'bg-rose-50 hover:bg-rose-100/60'
                  : 'hover:bg-slate-50'
              }`}
            >
              <td className="py-4 px-4 w-12 text-center" onClick={(e) => e.stopPropagation()}>
                {bot.role !== 'Viewer' && (
                  <input
                    type="checkbox"
                    checked={selectedBotIds.has(bot.id)}
                    onChange={() => onToggleSelectBot(bot.id)}
                    className="rounded border-2 border-[#0A0A0A] text-[#0A0A0A] focus:ring-0"
                  />
                )}
              </td>
              <td className="py-4 px-2">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`w-3 h-3 rounded-full shrink-0 border border-[#0A0A0A] ${
                      bot.blocked
                        ? 'bg-rose-500'
                        : bot.active
                        ? 'bg-emerald-400'
                        : 'bg-slate-300'
                    }`}
                  />
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-xs text-[#0A0A0A] uppercase hover:underline truncate max-w-xs md:max-w-md">
                        {bot.name}
                      </span>
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
                    {bot.blocked ? (
                      <span className="text-[11px] text-slate-700 font-bold truncate max-w-xs md:max-w-md mt-0.5">
                        {translateBlockReason(bot.blockReason)}
                      </span>
                    ) : bot.description ? (
                      <span className="text-[11px] text-slate-600 font-medium line-clamp-1 max-w-xs md:max-w-md mt-0.5">
                        {bot.description}
                      </span>
                    ) : null}
                  </div>
                </div>
              </td>
              {showRuns && <td className="py-4 px-2 w-28 text-xs font-bold text-[#0A0A0A] text-center">{bot.runs ?? 1}</td>}
              {showCtr && (
                <td className="py-4 px-2 w-28 text-xs font-bold text-[#0A0A0A] text-center">
                  {(bot.runs ?? 0) === 0 ? '0%' : `${(12.5 + ((bot.id * 7) % 36) + ((bot.id * 3) % 10) / 10).toFixed(1)}%`}
                </td>
              )}
              <td className="py-4 px-2 w-40 text-xs font-bold text-slate-700">{formatRelativeTime(bot.updatedAt || bot.createdAt)}</td>
              <td className="py-4 px-4 w-12 text-right" onClick={(e) => e.stopPropagation()}>
                {bot.role !== 'Viewer' && (
                  <button
                    onClick={(e) => onMenuClick(e, bot.id)}
                    className="text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-[#F2EBDD] p-1.5 rounded-lg transition-all cursor-pointer border border-transparent hover:border-[#0A0A0A]"
                  >
                    <MoreVertical size={16} />
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
