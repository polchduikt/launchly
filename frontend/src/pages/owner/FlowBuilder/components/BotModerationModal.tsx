import React, { useState, useEffect } from 'react';
import {
  X,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { useTranslation } from '../../../../i18n/config';
import type { BotResponse } from '../../../../types/bot';
import type { MediaMode, ViolationAction } from '../../../../api/bot';
import {
  useBotModerationQuery,
  useUpdateBotModerationMutation
} from '../../../../hooks/bot/useBotModeration';

interface BotModerationModalProps {
  bot: BotResponse | null;
  isOpen: boolean;
  onClose: () => void;
}

export const BotModerationModal: React.FC<BotModerationModalProps> = ({
  bot,
  isOpen,
  onClose
}) => {
  const { t } = useTranslation();
  const botId = bot?.id;

  const { data: moderationRule, isLoading: isFetching } = useBotModerationQuery(botId);
  const updateMutation = useUpdateBotModerationMutation(botId);

  const [enabled, setEnabled] = useState(false);
  const [antiForwardEnabled, setAntiForwardEnabled] = useState(false);
  const [antiLinkEnabled, setAntiLinkEnabled] = useState(false);
  const [allowedLinks, setAllowedLinks] = useState('');
  const [stopWords, setStopWords] = useState('');
  const [defaultProfanityFilter, setDefaultProfanityFilter] = useState(true);
  const [mediaMode, setMediaMode] = useState<MediaMode>('ALL');
  const [actionOnViolation, setActionOnViolation] = useState<ViolationAction>('DELETE_AND_WARN');
  const [warningTemplate, setWarningTemplate] = useState('⚠️ {user}, ваше повідомлення було видалено через порушення правил чату!');
  const [warnTtlSeconds, setWarnTtlSeconds] = useState(5);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  useEffect(() => {
    if (moderationRule) {
      setEnabled(moderationRule.enabled ?? false);
      setAntiForwardEnabled(moderationRule.antiForwardEnabled ?? false);
      setAntiLinkEnabled(moderationRule.antiLinkEnabled ?? false);
      setAllowedLinks(moderationRule.allowedLinks ?? '');
      setStopWords(moderationRule.stopWords ?? '');
      setDefaultProfanityFilter(moderationRule.defaultProfanityFilter ?? true);
      setMediaMode(moderationRule.mediaMode ?? 'ALL');
      setActionOnViolation(moderationRule.actionOnViolation ?? 'DELETE_AND_WARN');
      if (moderationRule.warningTemplate) setWarningTemplate(moderationRule.warningTemplate);
      if (moderationRule.warnTtlSeconds) setWarnTtlSeconds(moderationRule.warnTtlSeconds);
    }
  }, [moderationRule]);

  if (!isOpen || !bot) return null;

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({
        chatId: '*',
        enabled,
        antiForwardEnabled,
        antiLinkEnabled,
        allowedLinks,
        stopWords,
        defaultProfanityFilter,
        mediaMode,
        actionOnViolation,
        warningTemplate,
        warnTtlSeconds
      });
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 1000);
    } catch {
    }
  };

  const mediaModeOptions: { value: MediaMode; label: string; desc: string }[] = [
    {
      value: 'ALL',
      label: 'Текст + Медіа',
      desc: 'Без обмежень (дозволені будь-які повідомлення)'
    },
    {
      value: 'MEDIA_ONLY',
      label: 'Тільки медіа',
      desc: 'Дозволено лише фото, відео, файли, голосові'
    },
    {
      value: 'TEXT_ONLY',
      label: 'Тільки текст',
      desc: 'Дозволено лише текст (медіафайли видаляються)'
    }
  ];

  const actionOptions: { value: ViolationAction; label: string; desc: string }[] = [
    {
      value: 'DELETE_ONLY',
      label: 'Тільки видалити',
      desc: 'Повідомлення видаляється без сповіщень'
    },
    {
      value: 'DELETE_AND_WARN',
      label: 'Видалити + Попередити',
      desc: 'Видаляє та пише автопопередження в чат'
    },
    {
      value: 'DELETE_AND_MUTE',
      label: 'Видалити + Mute (1 год)',
      desc: 'Видаляє та блокує можливість писати'
    },
    {
      value: 'DELETE_AND_BAN',
      label: 'Видалити + Бан',
      desc: 'Видаляє та виганяє порушника з чату'
    }
  ];

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-[#0A0A0A]/40 z-50 flex items-center justify-center p-4 cursor-pointer overflow-hidden"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white border-2 border-[#0A0A0A] w-full max-w-2xl rounded-2xl shadow-sm relative flex flex-col max-h-[88vh] cursor-default text-left overflow-hidden"
      >
        <div className="flex items-center justify-between p-6 pb-4 border-b border-slate-200 shrink-0">
          <div>
            <h3 className="font-['Anybody',sans-serif] font-black text-[#0A0A0A] text-base uppercase">
              {t('settings.moderation.modal_title', 'Автоматична модерація та Стоп-слова')}
            </h3>
            <p className="text-xs text-slate-700 font-bold mt-0.5">
              {t('settings.moderation.modal_subtitle', 'Фільтрація контенту, анти-спам, анти-форвард та обмеження режимів')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#0A0A0A] hover:bg-slate-100 transition-all border-2 border-transparent hover:border-[#0A0A0A] cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-5">
          {saveSuccess && (
            <div className="p-3 bg-emerald-50 border-2 border-emerald-500 rounded-xl flex items-center gap-2 text-emerald-800 text-xs font-bold">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <span>{t('settings.moderation.saved_success', 'Налаштування модерації успішно збережено!')}</span>
            </div>
          )}

          {isFetching ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-500">
              <Loader2 className="animate-spin" size={24} />
              <span className="text-xs font-bold uppercase tracking-wider">Завантаження правил...</span>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-slate-50 border-2 border-[#0A0A0A] rounded-xl">
                <div>
                  <div className="text-xs font-black uppercase text-[#0A0A0A]">
                    {t('settings.moderation.enable_moderation', 'Увімкнути автомодерацію')}
                  </div>
                  <div className="text-[11px] text-slate-600 font-bold mt-0.5">
                    {t('settings.moderation.enable_moderation_desc', 'Бот автоматично скануватиме вхідні повідомлення у чатах та групах')}
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={enabled}
                  onClick={() => setEnabled(!enabled)}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out cursor-pointer border-2 border-[#0A0A0A] ${
                    enabled ? 'bg-[#0A0A0A]' : 'bg-white'
                  }`}
                >
                  <div
                    className={`w-3.5 h-3.5 rounded-full transition-transform duration-200 ease-in-out ${
                      enabled ? 'transform translate-x-6 bg-white' : 'bg-[#0A0A0A]'
                    }`}
                  />
                </button>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-[#0A0A0A]">
                  {t('settings.moderation.stopwords_title', 'Стоп-слова та анти-спам')}
                </h4>

                <label className="flex items-start gap-2.5 p-3 border-2 border-[#0A0A0A] rounded-xl bg-white cursor-pointer hover:bg-slate-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={defaultProfanityFilter}
                    onChange={(e) => setDefaultProfanityFilter(e.target.checked)}
                    className="mt-0.5 rounded border-2 border-[#0A0A0A]"
                  />
                  <div>
                    <div className="text-xs font-black text-[#0A0A0A]">
                      {t('settings.moderation.default_filter', 'Базовий фільтр мату та крипто-спаму')}
                    </div>
                    <div className="text-[11px] text-slate-600 font-bold mt-0.5">
                      {t('settings.moderation.default_filter_desc', 'Автоматично блокує 100x, роздачі крипти, казино, ставки та ненормативну лексику')}
                    </div>
                  </div>
                </label>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-[#0A0A0A]">
                    {t('settings.moderation.custom_stopwords', 'Власні стоп-слова та фрази (через кому або новий рядок)')}
                  </label>
                  <textarea
                    value={stopWords}
                    onChange={(e) => setStopWords(e.target.value)}
                    placeholder="крипта, казино, ставки, 100x, t.me/joinchat"
                    rows={3}
                    className="w-full px-3 py-2 bg-white border-2 border-[#0A0A0A] rounded-xl text-xs font-bold text-[#0A0A0A] focus:outline-none placeholder:text-slate-400 font-mono resize-y"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-[#0A0A0A]">
                  {t('settings.moderation.antiforward_links_title', 'Anti-Forward та Захист від посилань')}
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="flex items-start gap-2.5 p-3 border-2 border-[#0A0A0A] rounded-xl bg-white cursor-pointer hover:bg-slate-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={antiForwardEnabled}
                      onChange={(e) => setAntiForwardEnabled(e.target.checked)}
                      className="mt-0.5 rounded border-2 border-[#0A0A0A]"
                    />
                    <div>
                      <div className="text-xs font-black text-[#0A0A0A]">
                        {t('settings.moderation.antiforward', 'Anti-Forward')}
                      </div>
                      <div className="text-[11px] text-slate-600 font-bold mt-0.5">
                        {t('settings.moderation.antiforward_desc', 'Заборона пересилань з чужих каналів')}
                      </div>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-3 border-2 border-[#0A0A0A] rounded-xl bg-white cursor-pointer hover:bg-slate-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={antiLinkEnabled}
                      onChange={(e) => setAntiLinkEnabled(e.target.checked)}
                      className="mt-0.5 rounded border-2 border-[#0A0A0A]"
                    />
                    <div>
                      <div className="text-xs font-black text-[#0A0A0A]">
                        {t('settings.moderation.antilink', 'Anti-Link')}
                      </div>
                      <div className="text-[11px] text-slate-600 font-bold mt-0.5">
                        {t('settings.moderation.antilink_desc', 'Видаляти сторонні посилання')}
                      </div>
                    </div>
                  </label>
                </div>

                {antiLinkEnabled && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-[#0A0A0A]">
                      {t('settings.moderation.allowed_links', 'Дозволені домени (White-list)')}
                    </label>
                    <input
                      type="text"
                      value={allowedLinks}
                      onChange={(e) => setAllowedLinks(e.target.value)}
                      placeholder="launchly.app, youtube.com, google.com"
                      className="w-full px-3 py-2 bg-white border-2 border-[#0A0A0A] rounded-xl text-xs font-bold text-[#0A0A0A] focus:outline-none placeholder:text-slate-400 font-mono"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-[#0A0A0A]">
                  {t('settings.moderation.media_mode_title', 'Режим типу контенту')}
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {mediaModeOptions.map((opt) => {
                    const isSelected = mediaMode === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setMediaMode(opt.value)}
                        className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                          isSelected
                            ? 'border-[#0A0A0A] bg-[#0A0A0A] text-white shadow-[2px_2px_0px_0px_#0A0A0A]'
                            : 'border-[#0A0A0A] bg-white text-[#0A0A0A] hover:bg-slate-50'
                        }`}
                      >
                        <div className="text-xs font-black uppercase">{opt.label}</div>
                        <div className={`text-[10px] font-bold ${isSelected ? 'text-slate-200' : 'text-slate-600'}`}>
                          {opt.desc}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-[#0A0A0A]">
                  {t('settings.moderation.sanction_title', 'Дія при виявленні порушення')}
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {actionOptions.map((act) => {
                    const isSelected = actionOnViolation === act.value;
                    return (
                      <button
                        key={act.value}
                        type="button"
                        onClick={() => setActionOnViolation(act.value)}
                        className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between gap-1 ${
                          isSelected
                            ? 'border-[#0A0A0A] bg-[#0A0A0A] text-white shadow-[2px_2px_0px_0px_#0A0A0A]'
                            : 'border-[#0A0A0A] bg-white text-[#0A0A0A] hover:bg-slate-50'
                        }`}
                      >
                        <div className="text-xs font-black uppercase">{act.label}</div>
                        <div className={`text-[10px] font-bold ${isSelected ? 'text-slate-200' : 'text-slate-600'}`}>
                          {act.desc}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {actionOnViolation !== 'DELETE_ONLY' && (
                  <div className="space-y-3 pt-3 border-t border-slate-200">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-[#0A0A0A]">
                        {t('settings.moderation.warn_template', "Шаблон тексту попередження ({user} = нікнейм/ім'я)")}
                      </label>
                      <input
                        type="text"
                        value={warningTemplate}
                        onChange={(e) => setWarningTemplate(e.target.value)}
                        className="w-full px-3 py-2 bg-white border-2 border-[#0A0A0A] rounded-xl text-xs font-bold text-[#0A0A0A] focus:outline-none"
                      />
                    </div>

                    <div className="flex items-center gap-3">
                      <label className="text-[10px] font-black uppercase text-[#0A0A0A] whitespace-nowrap">
                        {t('settings.moderation.warn_ttl', 'Автознищення попередження (сек):')}
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={60}
                        value={warnTtlSeconds}
                        onChange={(e) => setWarnTtlSeconds(Number(e.target.value) || 5)}
                        className="w-20 px-3 py-1.5 bg-white border-2 border-[#0A0A0A] rounded-xl text-xs font-bold text-[#0A0A0A] focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end p-6 pt-4 border-t border-slate-200 shrink-0 bg-white">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 bg-white hover:bg-[#0A0A0A] hover:text-white text-[#0A0A0A] border-2 border-[#0A0A0A] rounded-xl text-xs font-black uppercase transition-all cursor-pointer text-center"
          >
            {t('settings.telegram.modal.btn_cancel', 'Скасувати')}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="w-full sm:w-auto px-6 py-2.5 bg-[#0A0A0A] hover:bg-white hover:text-[#0A0A0A] text-white border-2 border-[#0A0A0A] rounded-xl text-xs font-black uppercase transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 shadow-[2px_2px_0px_#0A0A0A]"
          >
            {updateMutation.isPending && (
              <Loader2 className="animate-spin" size={14} />
            )}
            <span>{t('settings.moderation.btn_save', 'Зберегти правила')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};