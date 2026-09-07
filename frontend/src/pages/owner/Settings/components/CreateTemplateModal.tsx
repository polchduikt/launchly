import React, { useState } from 'react';
import { X, Layout, Copy, Check, Loader2, Sparkles } from 'lucide-react';
import { createTemplateApi, type TemplateResponse } from '../../../../api/templateApi';
import { t } from '../../../../i18n/config';

interface CreateTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  botId: number;
}

export const CreateTemplateModal: React.FC<CreateTemplateModalProps> = ({
  isOpen,
  onClose,
  botId,
}) => {
  const [template, setTemplate] = useState<TemplateResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerateTemplate = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await createTemplateApi({ botId, name: 'Шаблон бота' });
      setTemplate(res);
    } catch (err: any) {
      setErrorMsg(t('settings.template.error', 'Не вдалося створити шаблон. Спробуйте пізніше.'));
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (!template?.shareUrl) return;
    navigator.clipboard.writeText(template.shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 animate-fade-in font-['JetBrains_Mono',monospace]"
    >
      <div className="bg-white border-4 border-ink shadow-brutal-2xl rounded-3xl max-w-lg w-full overflow-hidden text-ink relative">
        <div className="p-6 border-b-2 border-ink flex items-center justify-between bg-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-ink text-white border-2 border-ink flex items-center justify-center shrink-0 shadow-brutal-sm">
              <Sparkles size={22} />
            </div>
            <div>
              <h2 className="font-extrabold text-base uppercase tracking-tight text-ink">
                {t('settings.template.title', 'Шаблон')}
              </h2>
              <p className="text-[11px] font-bold text-slate-600">
                {t('settings.template.subtitle', 'Створіть посилання, щоб поділитися воронками')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl border-2 border-ink bg-white text-ink hover:bg-ink hover:text-white transition-all cursor-pointer shadow-sm"
          >
            <X size={16} />
          </button>
        </div>
        <div className="p-6 space-y-5">
          <div className="bg-white border-2 border-ink p-4 rounded-2xl space-y-2">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase text-ink">
              <Layout size={16} className="text-indigo-600 shrink-0" />
              <span>{t('settings.template.info_title', 'Як працює шаблон:')}</span>
            </div>
            <p className="text-[11.5px] font-bold text-slate-700 leading-relaxed">
              {t(
                'settings.template.info_desc',
                'Система створить знімок усіх воронок та автоматизацій цього бота. Будь-хто, хто отримає посилання, зможе миттєво встановити цей шаблон у свій бот. Підписники, чати та токени НЕ копіюються.'
              )}
            </p>
          </div>

          {errorMsg && (
            <div className="bg-rose-100 border-2 border-rose-600 text-rose-800 p-3 rounded-xl text-xs font-bold">
              {errorMsg}
            </div>
          )}

          {template ? (
            <div className="space-y-3 pt-2">
              <label className="block text-[11px] font-extrabold uppercase text-ink leading-tight">
                {t('settings.template.link_label', 'Ваше посилання на шаблон:')}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={template.shareUrl}
                  className="flex-1 px-3.5 py-2.5 rounded-xl border-2 border-ink bg-white text-xs font-black text-ink focus:outline-none tracking-wide select-all"
                />
                <button
                  onClick={handleCopyLink}
                  className="px-4 py-2.5 bg-ink hover:bg-[#2A2A2A] text-white border-2 border-ink shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  {copied ? (
                    <>
                      <Check size={14} className="text-emerald-800" />
                      <span>{t('common.copied', 'Скопійовано!')}</span>
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      <span>{t('common.copy', 'Копіювати')}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="pt-2 text-center">
              <button
                onClick={handleGenerateTemplate}
                disabled={loading}
                className="w-full py-3 bg-ink hover:bg-[#2A2A2A] text-canvas border-2 border-ink shadow-brutal hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    <span>{t('settings.template.generating', 'Генеруємо шаблон...')}</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} className="text-amber-400" />
                    <span>{t('settings.template.generate_btn', 'Згенерувати посилання на шаблон')}</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        <div className="p-4 border-t-2 border-ink bg-white flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-white hover:bg-slate-100 text-ink border-2 border-ink text-xs font-extrabold rounded-xl transition-all cursor-pointer"
          >
            {t('common.close', 'Закрити')}
          </button>
        </div>
      </div>
    </div>
  );
};
