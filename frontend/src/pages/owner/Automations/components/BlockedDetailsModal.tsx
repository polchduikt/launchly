import React from 'react';
import { X, ShieldAlert } from 'lucide-react';
import { t, getLanguage } from '../../../../i18n/config';
import type { BotResponse } from '../../../../types/bot';

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
    if (!dateStr) return '—';
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
    } catch (e) {
      return dateStr;
    }
  };

  const translateBlockReason = (reason?: string | null) => {
    if (!reason) return '';
    const lang = getLanguage();
    const ukMap: Record<string, string> = {
      'Suspicious activity': 'Підозріла активність',
      'Violation of platform rules': 'Порушення правил платформи',
      'Spam or unauthorized bulk messaging': 'Спам або несанкціоновані розсилки',
      'Other reason': 'Інша причина',
      'Підозріла активність': 'Підозріла активність',
      'Порушення правил платформи': 'Порушення правил платформи',
      'Спам або несанкціоновані розсилки': 'Спам або несанкціоновані розсилки',
      'Інша причина': 'Інша причина',
    };
    const enMap: Record<string, string> = {
      'Suspicious activity': 'Suspicious activity',
      'Violation of platform rules': 'Violation of platform rules',
      'Spam or unauthorized bulk messaging': 'Spam or unauthorized bulk messaging',
      'Other reason': 'Other reason',
      'Підозріла активність': 'Suspicious activity',
      'Порушення правил платформи': 'Violation of platform rules',
      'Спам або несанкціоновані розсилки': 'Spam or unauthorized bulk messaging',
      'Інша причина': 'Other reason',
    };
    if (lang === 'uk') {
      return ukMap[reason] || t(reason) || reason;
    }
    return enMap[reason] || t(reason) || reason;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-canvas border-2 border-ink rounded-3xl p-6 shadow-brutal space-y-5 animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 border-2 border-ink flex items-center justify-center text-rose-600 shadow-brutal-xs shrink-0">
              <ShieldAlert size={22} />
            </div>
            <div>
              <h3 className="font-['Anybody',sans-serif] text-base font-black text-ink uppercase leading-snug">
                {t('automations.blocked_modal_title') !== 'automations.blocked_modal_title'
                  ? t('automations.blocked_modal_title')
                  : 'Блокування автоматизації'}
              </h3>
              <p className="text-xs text-slate-700 font-bold">{bot.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl border-2 border-ink bg-white flex items-center justify-center hover:bg-ink hover:text-canvas transition-colors shadow-brutal-xs shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <p className="text-xs text-slate-800 font-bold leading-relaxed">
            {t('automations.blocked_modal_desc') !== 'automations.blocked_modal_desc'
              ? t('automations.blocked_modal_desc')
              : 'Цю автоматизацію було заблоковано адміністрацією через порушення або підозрілу активність.'}
          </p>

          <div className="bg-white border-2 border-ink rounded-2xl p-4 space-y-2.5">
            <div className="flex items-start justify-between text-xs">
              <span className="text-slate-700 font-bold">
                {t('broadcast.blocked_modal_reason')}
              </span>
              <span className="font-black text-ink text-right max-w-[200px]">
                {translateBlockReason(bot.blockReason)}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs border-t-2 border-ink pt-2">
              <span className="text-slate-700 font-bold">
                {t('broadcast.blocked_modal_date')}
              </span>
              <span className="font-black text-ink">
                {formatDateShort(bot.blockedAt || bot.updatedAt)}
              </span>
            </div>
          </div>

          <p className="text-[11px] text-slate-700 font-bold leading-relaxed italic">
            {t('automations.blocked_modal_support')}
          </p>
        </div>

        <div className="pt-2 border-t-2 border-ink flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-ink hover:bg-[#2A2A2A] text-canvas font-black text-xs uppercase rounded-xl border-2 border-ink transition-all cursor-pointer"
          >
            {t('broadcast.blocked_modal_close')}
          </button>
        </div>
      </div>
    </div>
  );
};
