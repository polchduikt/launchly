import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Sparkles, ArrowRight, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { getTemplateByShareCodeApi, installTemplateApi, type TemplateResponse } from '../../../api/templateApi';
import { useBotsQuery } from '../../../hooks/bot/useBotsQuery';
import { useBotStore } from '../../../store/useBotStore';
import { useAuthStore } from '../../../store/useAuthStore';
import { useTranslation } from '../../../i18n/config';

export const InstallTemplatePage: React.FC = () => {
  const { shareCode } = useParams<{ shareCode: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const isAuthenticated = useAuthStore((state) => !!state.accessToken);
  const activeBotId = useBotStore((state) => state.activeBotId);
  const { data: bots = [] } = useBotsQuery(isAuthenticated);

  const [template, setTemplate] = useState<TemplateResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedBotId, setSelectedBotId] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [installedSuccess, setInstalledSuccess] = useState(false);

  useEffect(() => {
    if (!shareCode) return;
    setLoading(true);
    setErrorMsg(null);
    getTemplateByShareCodeApi(shareCode)
      .then((res) => {
        setTemplate(res);
      })
      .catch(() => {
        setErrorMsg(t('template.install.not_found', 'Шаблон не знайдено або посилання застаріло.'));
      })
      .finally(() => {
        setLoading(false);
      });
  }, [shareCode]);

  useEffect(() => {
    if (bots.length > 0) {
      setSelectedBotId(activeBotId || bots[0].id);
    }
  }, [bots, activeBotId]);

  const handleInstall = async () => {
    if (!shareCode || !selectedBotId) return;
    setSubmitting(true);
    setErrorMsg(null);
    try {
      await installTemplateApi(shareCode, selectedBotId);
      setInstalledSuccess(true);
    } catch (err: any) {
      setErrorMsg(t('template.install.error', 'Не вдалося встановити шаблон. Спробуйте пізніше.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F2EBDD] font-['JetBrains_Mono',monospace] flex flex-col items-center justify-center p-4 text-[#0A0A0A]">
      <div className="bg-[#F2EBDD] border-4 border-[#0A0A0A] shadow-[10px_10px_0px_#0A0A0A] rounded-3xl max-w-xl w-full p-8 space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b-2 border-[#0A0A0A]">
          <div className="w-12 h-12 rounded-2xl bg-amber-400 border-2 border-[#0A0A0A] shadow-[3px_3px_0px_#0A0A0A] flex items-center justify-center shrink-0">
            <Sparkles size={24} className="text-[#0A0A0A]" />
          </div>
          <div>
            <h1 className="font-['Anybody',sans-serif] text-xl font-black uppercase tracking-tight">
              {t('template.install.title', 'Встановити шаблон')}
            </h1>
            <p className="text-xs font-bold text-slate-600">
              Launchly Template System
            </p>
          </div>
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3">
            <Loader2 className="animate-spin text-[#0A0A0A]" size={32} />
            <span className="text-xs font-bold">{t('common.loading', 'Завантаження шаблону...')}</span>
          </div>
        ) : errorMsg && !template ? (
          <div className="bg-rose-100 border-2 border-rose-600 text-rose-900 p-6 rounded-2xl space-y-3">
            <div className="flex items-center gap-2 font-black text-sm uppercase">
              <AlertCircle size={20} />
              <span>{t('template.install.error_title', 'Помилка')}</span>
            </div>
            <p className="text-xs font-bold leading-relaxed">{errorMsg}</p>
          </div>
        ) : installedSuccess ? (
          <div className="bg-emerald-100 border-2 border-emerald-600 text-emerald-900 p-6 rounded-2xl space-y-4 text-center">
            <CheckCircle2 size={40} className="text-emerald-700 mx-auto" />
            <h2 className="font-black text-base uppercase">
              {t('template.install.success_title', 'Шаблон успішно встановлено!')}
            </h2>
            <p className="text-xs font-bold text-slate-700">
              Усі воронки та елементи шаблону збережено у ваш бот.
            </p>
            <button
              onClick={() => navigate('/templates?tab=installed')}
              className="w-full py-3 bg-[#0A0A0A] hover:bg-[#2A2A2A] text-[#F2EBDD] border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] text-xs font-black uppercase rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>{t('template.tab_installed_templates', 'Завантажені темплейти')}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        ) : template && (
          <div className="space-y-6">
            <div className="bg-white border-2 border-[#0A0A0A] p-5 rounded-2xl space-y-3 shadow-[3px_3px_0px_#0A0A0A]">
              <div className="flex items-center justify-between border-b border-[#0A0A0A]/15 pb-3">
                <h3 className="font-black text-sm uppercase text-[#0A0A0A]">{template.name}</h3>
                <span className="px-2.5 py-0.5 bg-amber-300 border border-[#0A0A0A] rounded-md font-black text-[10px] uppercase">
                  Template
                </span>
              </div>
              <p className="text-xs font-bold text-slate-600">{template.description}</p>
              <div className="flex items-center gap-4 text-[11px] font-bold text-slate-700 pt-1">
                <span>👤 Автор: <strong className="text-[#0A0A0A]">{template.creatorName}</strong></span>
                <span>🤖 Джерело: <strong className="text-[#0A0A0A]">{template.sourceBotName}</strong></span>
              </div>
            </div>
            {isAuthenticated ? (
              <div className="space-y-4">
                {bots.length > 0 ? (
                  <div className="space-y-2">
                    <label className="block text-xs font-black uppercase text-[#0A0A0A]">
                      {t('template.install.select_bot_label', 'Оберіть бот для встановлення:')}
                    </label>
                    <select
                      value={selectedBotId || ''}
                      onChange={(e) => setSelectedBotId(Number(e.target.value))}
                      className="w-full px-4 py-3 rounded-xl border-2 border-[#0A0A0A] bg-white text-xs font-black uppercase text-[#0A0A0A] focus:outline-none shadow-[2px_2px_0px_#0A0A0A] cursor-pointer"
                    >
                      {bots.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="bg-amber-50 border-2 border-[#0A0A0A] p-4 rounded-xl text-xs font-bold text-slate-700">
                    У вас немає активних ботів. Спочатку підключіть бот Telegram, щоб встановити цей шаблон.
                  </div>
                )}

                {errorMsg && (
                  <div className="bg-rose-100 border-2 border-rose-600 text-rose-900 p-3 rounded-xl text-xs font-bold">
                    {errorMsg}
                  </div>
                )}

                <button
                  onClick={handleInstall}
                  disabled={submitting || !selectedBotId || bots.length === 0}
                  className="w-full py-3.5 bg-amber-400 hover:bg-amber-500 text-[#0A0A0A] border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      <span>{t('template.install.installing', 'Встановлюємо шаблон...')}</span>
                    </>
                  ) : (
                    <>
                      <span>{t('template.install.install_btn', 'Встановити шаблон у бот')}</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="bg-amber-100 border-2 border-[#0A0A0A] p-6 rounded-2xl text-center space-y-4">
                <p className="text-xs font-bold text-slate-800">
                  Увійдіть у свій акаунт Launchly або зареєструйтеся, щоб встановити цей шаблон.
                </p>
                <Link
                  to={`/login?redirect=/templates/install/${shareCode}`}
                  className="inline-flex items-center justify-center py-3 px-6 bg-[#0A0A0A] hover:bg-[#2A2A2A] text-[#F2EBDD] border-2 border-[#0A0A0A] shadow-[3px_3px_0px_#0A0A0A] text-xs font-black uppercase rounded-xl transition-all gap-2"
                >
                  <span>Увійти для встановлення</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
