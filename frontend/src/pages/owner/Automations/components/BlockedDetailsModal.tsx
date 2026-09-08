import React from 'react';
import { X, ShieldAlert } from 'lucide-react';
import { t, getLanguage } from '../../../../i18n/config';
import type { BotResponse } from '../../../../types/bot';
import { translateBlockReason } from '../../../../utils/blockReason';

interface BlockedDetailsModalProps {
  bot: BotResponse | null;
  onClose: () => void;
}

export const BlockedDetailsModal: React.FC<BlockedDetailsModalProps> = ({
  bot,
  onClose,
}) => {
  if (!bot) return null;

  const formatDateShort = (dateStr?: string | null) => {
    if (!dateStr) return '�';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const lang = getLanguage();
      return d.toLocaleDateString(lang === 'uk' ? 'uk-UA' : 'en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };



  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A0A0A]/40 p-4 animate-in fade-in duration-150 select-none font-['JetBrains_Mono',monospace]"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-3xl shadow-[8px_8px_0px_0px_#0A0A0A] w-full max-w-md p-6 space-y-5 animate-in zoom-in-95 duration-200"
      >
        <div className="flex items-center justify-between border-b-2 border-[#0A0A0A] pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 border-2 border-[#0A0A0A] flex items-center justify-center text-rose-600 font-bold shrink-0">
              <ShieldAlert size={20} />
            </div>
            <div>
              <h3 className="font-['Anybody',sans-serif] text-base font-black text-[#0A0A0A] uppercase leading-snug">
                {t('automations.blocked_modal_title') !== 'automations.blocked_modal_title'
                  ? t('automations.blocked_modal_title')
                  : 'Блокування автоматизації'}
              </h3>
              <p className="text-xs text-slate-700 font-bold">{bot.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl border-2 border-[#0A0A0A] bg-white text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-white transition-all cursor-pointer shadow-sm"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4">
          <p className="text-xs text-slate-800 font-bold leading-relaxed">
            {t('automations.blocked_modal_desc') !== 'automations.blocked_modal_desc'
              ? t('automations.blocked_modal_desc')
              : 'Блокування автоматизації'}
          </p>

          <div className="bg-white border-2 border-[#0A0A0A] rounded-2xl p-4 space-y-2.5">
            <div className="flex items-start justify-between text-xs">
              <span className="text-slate-700 font-bold">
                {t('broadcast.blocked_modal_reason')}
              </span>
              <span className="font-black text-[#0A0A0A] text-right max-w-[200px]">
                {translateBlockReason(bot.blockReason)}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs border-t-2 border-[#0A0A0A] pt-2">
              <span className="text-slate-700 font-bold">
                {t('broadcast.blocked_modal_date')}
              </span>
              <span className="font-black text-[#0A0A0A]">
                {formatDateShort(bot.blockedAt || bot.updatedAt)}
              </span>
            </div>
          </div>

          <p className="text-[11px] text-slate-700 font-bold leading-relaxed italic">
            {t('automations.blocked_modal_support')}
          </p>
        </div>

        <div className="pt-2 border-t-2 border-[#0A0A0A] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-[#0A0A0A] hover:bg-[#2A2A2A] text-[#F2EBDD] font-black text-xs uppercase rounded-xl border-2 border-[#0A0A0A] transition-all cursor-pointer"
          >
            {t('broadcast.blocked_modal_close')}
          </button>
        </div>
      </div>
    </div>
  );
};
