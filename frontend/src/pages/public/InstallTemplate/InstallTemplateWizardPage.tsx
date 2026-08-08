import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  BookOpen,
  PlayCircle,
  Workflow,
  Radio,
  Sliders,
  Tag as TagIcon,
} from 'lucide-react';
import { getTemplateByShareCodeApi, installTemplateApi, type TemplateResponse } from '../../../api/templateApi';
import { useAuthStore } from '../../../store/useAuthStore';
import { t } from '../../../i18n/config';

export const InstallTemplateWizardPage: React.FC = () => {
  const { shareCode } = useParams<{ shareCode: string }>();
  const navigate = useNavigate();
  const accessToken = useAuthStore((s) => s.accessToken);
  const isAuthenticated = Boolean(accessToken);

  const [installStep, setInstallStep] = useState<1 | 2>(1);
  const [template, setTemplate] = useState<TemplateResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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

  const handleInstall = async () => {
    if (!shareCode) return;
    setSubmitting(true);
    setErrorMsg(null);
    try {
      await installTemplateApi(shareCode);
      setInstallStep(2);
    } catch (err: any) {
      setErrorMsg(t('template.install.error', 'Не вдалося встановити шаблон. Спробуйте пізніше.'));
    } finally {
      setSubmitting(false);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'JP';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-[#F2EBDD] font-['JetBrains_Mono',monospace] text-[#0A0A0A] flex flex-col">
      
      {/* Top Header */}
      <header className="bg-white border-b-2 border-[#0A0A0A] px-6 py-4 text-center">
        <span className="text-[11px] font-black uppercase text-slate-500 tracking-wider block">
          {t('template.install.header_title', 'Встановлення шаблону')}
        </span>
        <h1 className="font-['Anybody',sans-serif] text-xl font-black uppercase tracking-tight text-[#0A0A0A] mt-0.5">
          {template?.name || t('template.install.header_title', 'Встановлення шаблону')}
        </h1>
        {template?.creatorName && (
          <div className="flex items-center justify-center gap-2 mt-1 text-xs font-bold text-slate-600">
            <div className="w-5 h-5 rounded-full bg-[#0A0A0A] text-[#F2EBDD] border border-[#0A0A0A] flex items-center justify-center text-[9px] font-black font-['Anybody',sans-serif]">
              {getInitials(template.creatorName)}
            </div>
            <span>by {template.creatorName}</span>
          </div>
        )}
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-6 space-y-8">

        {/* Stepper Header (2 Steps: 1. Overview, 2. Complete) */}
        <div className="flex items-center justify-center gap-8 bg-white border-2 border-[#0A0A0A] p-4 shadow-[2px_2px_0px_#0A0A0A]">
          <div className="flex items-center gap-2.5">
            <div className={`w-7 h-7 border border-[#0A0A0A] flex items-center justify-center text-xs font-black ${installStep >= 1 ? 'bg-emerald-400 text-[#0A0A0A]' : 'bg-slate-100 text-slate-400'}`}>
              1
            </div>
            <span className="text-xs font-black uppercase tracking-wide">{t('template.install.step_overview', 'Огляд')}</span>
          </div>

          <div className="w-16 h-0.5 bg-[#0A0A0A]/20" />

          <div className="flex items-center gap-2.5">
            <div className={`w-7 h-7 border border-[#0A0A0A] flex items-center justify-center text-xs font-black ${installStep >= 2 ? 'bg-emerald-400 text-[#0A0A0A]' : 'bg-slate-100 text-slate-400'}`}>
              2
            </div>
            <span className="text-xs font-black uppercase tracking-wide">{t('template.install.step_complete', 'Завершення')}</span>
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center space-y-3 bg-white border-2 border-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A]">
            <Loader2 className="animate-spin mx-auto text-[#0A0A0A]" size={36} />
            <span className="text-xs font-bold uppercase">{t('template.install.loading', 'Завантаження шаблону...')}</span>
          </div>
        ) : errorMsg && !template ? (
          <div className="bg-rose-100 border-2 border-[#0A0A0A] text-rose-900 p-6 space-y-3 shadow-[2px_2px_0px_#0A0A0A]">
            <div className="flex items-center gap-2 font-black text-sm uppercase">
              <AlertCircle size={20} />
              <span>{t('template.install.error_title', 'Помилка завантаження')}</span>
            </div>
            <p className="text-xs font-bold">{errorMsg}</p>
          </div>
        ) : installStep === 2 ? (
          <div className="bg-white border-2 border-[#0A0A0A] p-8 shadow-[2px_2px_0px_#0A0A0A] text-center space-y-4">
            <div className="w-14 h-14 bg-emerald-400 border-2 border-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A] flex items-center justify-center mx-auto text-emerald-950">
              <CheckCircle2 size={32} strokeWidth={2.5} />
            </div>
            <h2 className="font-['Anybody',sans-serif] text-xl font-black uppercase">
              {t('template.install.success_title', 'Шаблон успішно встановлено!')}
            </h2>
            <p className="text-xs font-bold text-slate-600 max-w-md mx-auto leading-relaxed">
              {t('template.install.success_desc', 'Усі автоматизації, розсилки, користувацькі поля та теги з шаблону додано до вашого акаунту.')}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
              <button
                onClick={() => navigate('/automations')}
                className="px-6 py-3.5 bg-[#0A0A0A] hover:bg-[#2A2A2A] text-[#F2EBDD] border border-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A] text-xs font-black uppercase transition-all cursor-pointer inline-flex items-center gap-2"
              >
                <span>{t('template.install.go_automations', 'Перейти до автоматизацій')}</span>
                <ArrowRight size={15} />
              </button>
              {(template?.broadcastCount ?? 0) > 0 && (
                <button
                  onClick={() => navigate('/broadcasts')}
                  className="px-6 py-3.5 bg-white hover:bg-slate-100 text-[#0A0A0A] border-2 border-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A] text-xs font-black uppercase transition-all cursor-pointer inline-flex items-center gap-2"
                >
                  <span>{t('template.install.go_broadcasts', 'Перейти до розсилок')}</span>
                </button>
              )}
              <button
                onClick={() => navigate('/templates')}
                className="px-6 py-3.5 bg-amber-200 hover:bg-amber-300 text-[#0A0A0A] border-2 border-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A] text-xs font-black uppercase transition-all cursor-pointer inline-flex items-center gap-2"
              >
                <span>{t('template.tab_installed_templates', 'Завантажені темплейти')}</span>
              </button>
            </div>
          </div>
        ) : template && (
          <div className="space-y-8">
            
            {/* Main Grid: Content Preview & About */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              
              {/* Left Card: Template Content */}
              <div className="bg-white border-2 border-[#0A0A0A] p-6 shadow-[2px_2px_0px_#0A0A0A] space-y-4">
                <div className="flex items-center justify-between border-b-2 border-[#0A0A0A] pb-3">
                  <h3 className="font-black text-xs uppercase text-[#0A0A0A]">
                    {t('template.install.content_title', 'Вміст шаблону')}
                  </h3>
                  <span className="px-2 py-0.5 bg-emerald-300 border border-[#0A0A0A] font-black text-[10px] uppercase">
                    {t('template.badge_free', 'FREE')}
                  </span>
                </div>

                {/* Avatar & Title preview */}
                <div className="flex items-center gap-3 p-3 bg-amber-50 border-2 border-[#0A0A0A]">
                  <div className="w-12 h-12 bg-[#0A0A0A] border border-[#0A0A0A] flex items-center justify-center shrink-0 overflow-hidden text-[#F2EBDD]">
                    {template.avatarUrl ? (
                      <img src={template.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm font-black font-['Anybody',sans-serif]">
                        {getInitials(template.creatorName || template.name)}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-black text-xs uppercase text-[#0A0A0A] truncate">
                      {template.name}
                    </h4>
                    <span className="text-[11px] font-bold text-slate-500 block truncate">
                      {t('template.install.source', 'Джерело:')} {template.sourceBotName || 'Launchly'}
                    </span>
                  </div>
                </div>

                {/* Element counts summary */}
                <div className="space-y-2 text-xs font-bold">
                  <div className="p-3 bg-slate-50 border border-[#0A0A0A] flex items-center justify-between">
                    <span className="flex items-center gap-2 text-slate-800">
                      <Workflow size={15} className="text-[#0A0A0A]" />
                      <span>{t('template.install.automations_label', 'Автоматизації / Воронки')}</span>
                    </span>
                    <span className="px-2 py-0.5 bg-white border border-[#0A0A0A] font-black text-[11px]">
                      {template.flowCount}
                    </span>
                  </div>

                  {template.broadcastCount > 0 && (
                    <div className="p-3 bg-slate-50 border border-[#0A0A0A] flex items-center justify-between">
                      <span className="flex items-center gap-2 text-slate-800">
                        <Radio size={15} className="text-[#0A0A0A]" />
                        <span>{t('template.install.broadcasts_label', 'Розсилки')}</span>
                      </span>
                      <span className="px-2 py-0.5 bg-white border border-[#0A0A0A] font-black text-[11px]">
                        {template.broadcastCount}
                      </span>
                    </div>
                  )}

                  {template.fieldCount > 0 && (
                    <div className="p-3 bg-slate-50 border border-[#0A0A0A] flex items-center justify-between">
                      <span className="flex items-center gap-2 text-slate-800">
                        <Sliders size={15} className="text-[#0A0A0A]" />
                        <span>{t('template.custom_fields', 'Користувацькі поля')}</span>
                      </span>
                      <span className="px-2 py-0.5 bg-white border border-[#0A0A0A] font-black text-[11px]">
                        {template.fieldCount}
                      </span>
                    </div>
                  )}

                  {template.tagCount > 0 && (
                    <div className="p-3 bg-slate-50 border border-[#0A0A0A] flex items-center justify-between">
                      <span className="flex items-center gap-2 text-slate-800">
                        <TagIcon size={15} className="text-[#0A0A0A]" />
                        <span>{t('template.tags', 'Теги')}</span>
                      </span>
                      <span className="px-2 py-0.5 bg-white border border-[#0A0A0A] font-black text-[11px]">
                        {template.tagCount}
                      </span>
                    </div>
                  )}
                </div>

                {template.description && (
                  <div className="pt-2 text-xs font-bold text-slate-700 leading-relaxed">
                    <p className="font-black text-[#0A0A0A] uppercase mb-1">{t('template.about_title', 'Про шаблон')}:</p>
                    <p className="bg-[#F2EBDD]/40 border border-[#0A0A0A] p-3 text-[11.5px] leading-relaxed">
                      {template.description}
                    </p>
                  </div>
                )}
              </div>

              {/* Right Card: About & Installation Steps */}
              <div className="bg-white border-2 border-[#0A0A0A] p-6 shadow-[2px_2px_0px_#0A0A0A] space-y-5">
                <h3 className="font-black text-xs uppercase text-[#0A0A0A] border-b-2 border-[#0A0A0A] pb-3">
                  {t('template.install.info_title', 'Інформація про встановлення')}
                </h3>

                <div className="space-y-4 text-xs font-bold text-slate-700">
                  <div className="space-y-1">
                    <div className="text-[#0A0A0A] font-black uppercase text-xs flex items-center gap-2">
                      <span className="w-5 h-5 bg-[#0A0A0A] text-white text-[10px] flex items-center justify-center font-black">1</span>
                      <span>{t('template.install.step1_title', 'Перевірте вміст шаблону:')}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 font-medium pl-7">{t('template.install.step1_desc', 'Усі елементи будуть автоматично додані до вашого акаунту.')}</p>
                  </div>

                  <div className="space-y-1">
                    <div className="text-[#0A0A0A] font-black uppercase text-xs flex items-center gap-2">
                      <span className="w-5 h-5 bg-[#0A0A0A] text-white text-[10px] flex items-center justify-center font-black">2</span>
                      <span>{t('template.install.step2_title', 'Завершення в один клік:')}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 font-medium pl-7">{t('template.install.step2_desc', 'Натисніть кнопку нижче, щоб зберегти шаблон у розділ Завантажені темплейти.')}</p>
                  </div>
                </div>

                {(template.guideUrl || template.videoUrl) && (
                  <div className="pt-3 border-t-2 border-[#0A0A0A]/10 space-y-2 text-xs font-black">
                    {template.guideUrl && (
                      <a
                        href={template.guideUrl.startsWith('http') ? template.guideUrl : `https://${template.guideUrl}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 text-indigo-600 hover:underline"
                      >
                        <BookOpen size={15} />
                        <span>{t('template.guide_label', 'Інструкція з налаштування')}</span>
                      </a>
                    )}
                    {template.videoUrl && (
                      <a
                        href={template.videoUrl.startsWith('http') ? template.videoUrl : `https://${template.videoUrl}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 text-amber-600 hover:underline"
                      >
                        <PlayCircle size={15} />
                        <span>{t('template.video_label', 'Відео-презентація шаблону')}</span>
                      </a>
                    )}
                  </div>
                )}
              </div>

            </div>

            {/* Direct Action */}
            {isAuthenticated ? (
              <div className="bg-white border-2 border-[#0A0A0A] p-6 shadow-[2px_2px_0px_#0A0A0A] text-center space-y-4">
                {errorMsg && (
                  <div className="max-w-md mx-auto bg-rose-100 border border-rose-600 text-rose-900 p-2.5 text-xs font-bold text-center">
                    {errorMsg}
                  </div>
                )}

                <div>
                  <button
                    onClick={handleInstall}
                    disabled={submitting}
                    className="px-10 py-3.5 bg-[#0A0A0A] hover:bg-[#2A2A2A] text-[#F2EBDD] border border-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A] text-xs font-black uppercase tracking-wider transition-all cursor-pointer inline-flex items-center gap-2 disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="animate-spin" size={15} />
                        <span>{t('template.install.submitting', 'Встановлюємо...')}</span>
                      </>
                    ) : (
                      <>
                        <span>{t('template.install.submit_btn', 'Продовжити та встановити')}</span>
                        <ArrowRight size={15} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-amber-100 border-2 border-[#0A0A0A] p-8 text-center space-y-4 shadow-[2px_2px_0px_#0A0A0A]">
                <p className="text-xs font-black text-slate-800">
                  {t('template.install.login_prompt', 'Увійдіть у свій акаунт Launchly, щоб встановити цей шаблон.')}
                </p>
                <Link
                  to={`/login?redirect=/templates/install/${shareCode}`}
                  className="inline-flex items-center justify-center py-3.5 px-8 bg-[#0A0A0A] hover:bg-[#2A2A2A] text-[#F2EBDD] border border-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A] text-xs font-black uppercase transition-all gap-2"
                >
                  <span>{t('template.install.login_btn', 'Увійти для встановлення')}</span>
                  <ArrowRight size={15} />
                </Link>
              </div>
            )}

          </div>
        )}

      </main>
    </div>
  );
};
