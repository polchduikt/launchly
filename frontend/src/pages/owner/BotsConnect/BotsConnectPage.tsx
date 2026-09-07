import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import logo from '../../../assets/images/logo.png';
import { useCreateBotMutation } from '../../../hooks/bot/useBotMutations';
import { useBotsQuery } from '../../../hooks/bot/useBotsQuery';
import { AlertCircle, ArrowLeft, Loader2, Sparkles, MessageCircle, Send, Check } from 'lucide-react';
import { useTranslation } from '../../../i18n/config';

import { botSchema } from '../../../schemas/bot.schema';
import type { BotSchemaType } from '../../../schemas/bot.schema';

type BotFormValues = BotSchemaType;

export const BotsConnectPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: bots = [] } = useBotsQuery();
  const hasBots = bots.length > 0;
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [validationError, setValidationError] = useState<string | null>(null);

  const createBotMutation = useCreateBotMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BotFormValues>({
    resolver: zodResolver(botSchema),
    defaultValues: {
      botName: '',
      botToken: '',
      botDesc: '',
    },
  });

  const handleConnect = async (data: BotFormValues) => {
    setValidationError(null);

    try {
      await createBotMutation.mutateAsync({
        name: data.botName?.trim() || 'Telegram Bot',
        telegramToken: data.botToken.trim(),
        description: data.botDesc?.trim() || undefined,
      });
      navigate('/home');
    } catch (err: unknown) {
      const errMsg = axios.isAxiosError(err)
        ? (err.response?.data?.message ?? 'Failed to connect bot. Please verify your token.')
        : (err instanceof Error ? err.message : 'Something went wrong');
      setValidationError(errMsg);
    }
  };

  const handleBack = () => {
    if (step === 3) setStep(2);
    else if (step === 2) setStep(1);
    else if (hasBots) navigate('/home');
    else navigate('/');
  };

  return (
    <div className="min-h-screen bg-canvas text-ink font-['Geist',sans-serif] antialiased flex flex-col md:flex-row relative z-0 selection:bg-ink selection:text-canvas">
      <div
        className="fixed inset-0 z-[-1] pointer-events-none opacity-5"
        style={{
          backgroundColor: '#F2EBDD',
          backgroundImage: `
            linear-gradient(#0A0A0A 1px, transparent 1px),
            linear-gradient(90deg, #0A0A0A 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px',
          backgroundPosition: '-1px -1px'
        }}
      />
      <div className="w-full md:w-5/12 bg-canvas border-b-4 md:border-b-0 md:border-r-4 border-ink p-8 md:p-16 flex flex-col justify-between relative overflow-hidden">
        
        <div
          onClick={() => navigate('/home')}
          className="flex items-center mb-12 select-none cursor-pointer"
          title="Launchly Home"
        >
          <img src={logo} alt="Launchly Logo" className="h-10 sm:h-12 w-auto object-contain hover:opacity-80 transition-opacity" />
        </div>

        <div className="my-auto space-y-6 relative z-10">
          {step === 1 && (
            <>
              <div className="w-24 h-24 rounded-none bg-amber-400 border-4 border-ink flex items-center justify-center text-ink mb-8 shadow-brutal-lg">
                <Sparkles size={40} />
              </div>
              <h1 className="font-['Anybody',sans-serif] text-4xl sm:text-5xl lg:text-6xl font-black text-ink uppercase leading-none mb-4">
                {t('connect_bot.step1_title', 'Where would you like to start?')}
              </h1>
              <p className="text-base sm:text-lg text-ink/80 font-bold max-w-sm leading-relaxed">
                {t('connect_bot.step1_subtitle', "Don't worry, you can connect other communication channels later.")}
              </p>
            </>
          )}

          {step === 2 && (
            <>
              <div className="w-24 h-24 rounded-none bg-amber-400 border-4 border-ink flex items-center justify-center text-ink mb-8 shadow-brutal-lg">
                <Send size={40} />
              </div>
              <h1 className="font-['Anybody',sans-serif] text-4xl sm:text-5xl lg:text-6xl font-black text-ink uppercase leading-none mb-4">
                {t('connect_bot.step2_title', "Let's connect Telegram bot to Launchly")}
              </h1>
              <p className="text-base sm:text-lg text-ink/80 font-bold max-w-sm leading-relaxed">
                {t('connect_bot.step2_subtitle', 'You can create a brand new bot using BotFather or connect your existing one.')}
              </p>
            </>
          )}

          {step === 3 && (
            <>
              <div className="w-24 h-24 rounded-none bg-amber-400 border-4 border-ink flex items-center justify-center text-ink mb-8 shadow-brutal-lg">
                <Check size={40} />
              </div>
              <h1 className="font-['Anybody',sans-serif] text-4xl sm:text-5xl lg:text-6xl font-black text-ink uppercase leading-none mb-4">
                {t('connect_bot.step3_title', 'Choose your favourite bot and rock it!')}
              </h1>
              <p className="text-base sm:text-lg text-ink/80 font-bold max-w-sm leading-relaxed">
                {t('connect_bot.step3_subtitle', 'Just follow the quick step-by-step instructions to connect an existing Telegram bot.')}
              </p>
            </>
          )}
        </div>

        <div className="mt-12 md:mt-0 flex items-center justify-between gap-4">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 font-['JetBrains_Mono',monospace] text-xs font-bold uppercase tracking-wider hover:underline underline-offset-4 cursor-pointer text-ink group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
            {step === 1 ? t('connect_bot.back', 'Back') : step === 2 ? t('connect_bot.choose_another_channel', 'Choose Another Channel') : t('connect_bot.back', 'Back')}
          </button>

          <button
            onClick={() => navigate('/home')}
            className="font-['JetBrains_Mono',monospace] text-xs font-bold uppercase tracking-wider hover:underline underline-offset-4 cursor-pointer text-ink"
          >
            {t('connect_bot.skip_for_now', 'Skip for now')} &rarr;
          </button>
        </div>
      </div>

      <div className="flex-1 p-8 md:p-16 flex items-center justify-center overflow-y-auto max-h-screen">
        <div className="w-full max-w-xl my-auto">
          {step === 1 && (
            <div className="space-y-4">
              <button
                onClick={() => setStep(2)}
                className="w-full bg-white border-2 border-ink shadow-brutal-lg p-5 hover:bg-ink hover:text-canvas transition-all duration-200 group cursor-pointer text-left flex items-center gap-4"
              >
                <span className="w-12 h-12 rounded-none bg-emerald-300 border-2 border-ink flex items-center justify-center text-ink shrink-0 group-hover:bg-canvas">
                  <Send size={24} />
                </span>
                <div className="flex-1 min-w-0">
                  <h3 className="font-['Anybody',sans-serif] text-lg font-black text-ink group-hover:text-canvas transition-colors uppercase leading-tight">{t('connect_bot.tg_title', 'Telegram')}</h3>
                  <p className="font-['JetBrains_Mono',monospace] text-xs font-bold text-ink/70 group-hover:text-canvas/70 transition-colors leading-relaxed">{t('connect_bot.tg_desc', 'Power up your business with Telegram automation.')}</p>
                </div>
              </button>

              {[
                { key: 'ig', name: t('connect_bot.ig_title', 'Instagram'), icon: MessageCircle, color: 'bg-rose-300', desc: t('connect_bot.ig_desc', 'Supercharge your social media marketing with Instagram Automation.') },
                { key: 'wa', name: t('connect_bot.wa_title', 'WhatsApp'), icon: MessageCircle, color: 'bg-emerald-300', desc: t('connect_bot.wa_desc', 'Choose the most popular mobile messaging app and reach 2 billion users.') },
                { key: 'fb', name: t('connect_bot.fb_title', 'Facebook Messenger'), icon: MessageCircle, color: 'bg-sky-300', desc: t('connect_bot.fb_desc', 'Create Facebook Messenger automation to keep customers happy.') }
              ].map((c) => (
                <div
                  key={c.key}
                  className="w-full bg-white border-2 border-ink shadow-brutal p-5 flex items-center gap-4 select-none opacity-40 relative group"
                >
                  <span className={`w-12 h-12 rounded-none ${c.color} border-2 border-ink flex items-center justify-center shrink-0 text-ink`}>
                    <c.icon size={24} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-['Anybody',sans-serif] text-lg font-black text-ink/70 uppercase leading-tight">{c.name}</h3>
                    <p className="font-['JetBrains_Mono',monospace] text-xs font-bold text-ink/50 leading-relaxed">{c.desc}</p>
                  </div>
                  <span className="absolute right-4 top-4 text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-sm bg-ink text-canvas">
                    {t('connect_bot.coming_soon', 'Coming Soon')}
                  </span>
                </div>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="bg-white border-4 border-ink shadow-brutal-2xl p-8 sm:p-12 transition-all rounded-none">
              <h2 className="font-['Anybody',sans-serif] text-2xl sm:text-3xl font-black text-ink uppercase leading-tight mb-4">{t('connect_bot.step2_heading', 'How do you want to start?')}</h2>
              <p className="text-base text-ink/80 font-bold mb-8 leading-relaxed">
                {t('connect_bot.step2_subheading', 'In each scenario, we will guide you through easy step-by-step instructions.')}
              </p>
              
              <div className="space-y-3">
                <button
                  onClick={() => setStep(3)}
                  className="w-full bg-ink text-canvas font-['JetBrains_Mono',monospace] text-xs sm:text-sm font-extrabold uppercase tracking-wider px-8 py-4 border-2 border-ink shadow-brutal hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>{t('connect_bot.btn_connect_existing', 'Connect Existing Bot')}</span>
                </button>
                <a
                  href="https://t.me/BotFather"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full block bg-canvas text-ink font-['JetBrains_Mono',monospace] text-xs sm:text-sm font-extrabold uppercase tracking-wider px-8 py-4 border-2 border-ink shadow-brutal hover:bg-ink hover:text-canvas hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>{t('connect_bot.btn_create_new', '+ Create New Bot')}</span>
                </a>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="bg-white border-4 border-ink shadow-brutal-2xl p-8 sm:p-12 transition-all rounded-none">
              <h2 className="font-['Anybody',sans-serif] text-2xl sm:text-3xl font-black text-ink uppercase leading-tight mb-6">{t('connect_bot.step3_heading', 'Connect existing Telegram bot')}</h2>
              
              <div className="bg-amber-300 border-2 border-ink shadow-brutal p-4 flex gap-3 text-ink text-xs mb-6 leading-relaxed font-['JetBrains_Mono',monospace] font-bold">
                <AlertCircle size={16} className="shrink-0 text-ink" />
                <span>
                  {t('connect_bot.token_warning', 'We highly recommend you not to use the same token for different services, otherwise the bot will work incorrectly.')}
                </span>
              </div>

              <div className="space-y-4 mb-6">
                <h4 className="font-['JetBrains_Mono',monospace] text-xs font-black uppercase tracking-widest text-ink/50 mb-1">{t('connect_bot.instructions_title', 'Instructions:')}</h4>
                <ol className="space-y-3 font-['JetBrains_Mono',monospace] text-sm font-bold text-ink">
                  <li className="flex gap-2">
                    <span className="w-6 h-6 rounded-none bg-amber-400 border-2 border-ink text-ink text-sm font-black flex items-center justify-center shrink-0 shadow-brutal-sm">1</span>
                    <span>
                      {t('connect_bot.step1_inst_prefix', 'Open')}{' '}
                      <a
                        href="https://t.me/BotFather"
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-600 font-semibold hover:underline"
                      >
                        @BotFather
                      </a>{' '}
                      {t('connect_bot.step1_inst_suffix', 'in Telegram and click')}{' '}
                      <code className="bg-ink text-canvas px-1.5 py-0.5 rounded-sm text-xs font-['JetBrains_Mono',monospace] border border-canvas">/start</code>
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="w-6 h-6 rounded-none bg-amber-400 border-2 border-ink text-ink text-sm font-black flex items-center justify-center shrink-0 shadow-brutal-sm">2</span>
                    <span>{t('connect_bot.step2_inst', 'Send /mybots and choose the bot you want to connect')}</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="w-6 h-6 rounded-none bg-amber-400 border-2 border-ink text-ink text-sm font-black flex items-center justify-center shrink-0 shadow-brutal-sm">3</span>
                    <span>{t('connect_bot.step3_inst', 'Copy its API token and paste it below')}</span>
                  </li>
                </ol>
              </div>

              <form onSubmit={handleSubmit(handleConnect)} className="space-y-4">

                <div>
                  <label htmlFor="botToken" className="block font-['JetBrains_Mono',monospace] text-xs font-black uppercase tracking-widest text-ink/50 mb-1">
                    {t('connect_bot.token_label', 'Telegram bot token')}
                  </label>
                  <input
                    id="botToken"
                    type="text"
                    {...register('botToken')}
                    placeholder={t('connect_bot.token_placeholder', 'Enter token (e.g. 123456:ABC-DEF...)')}
                    className={`w-full px-4 py-3 border-2 border-ink shadow-brutal-sm font-['JetBrains_Mono',monospace] text-sm font-bold text-ink focus:outline-none focus:ring-2 focus:ring-ink transition-all ${errors.botToken ? 'border-rose-600 ring-rose-600' : ''}`}
                    disabled={createBotMutation.isPending}
                  />
                  {errors.botToken && (
                    <span className="font-['JetBrains_Mono',monospace] text-xs text-rose-600 mt-2 block font-bold">{errors.botToken.message}</span>
                  )}
                </div>

                <div>
                  <label htmlFor="botDesc" className="block font-['JetBrains_Mono',monospace] text-xs font-black uppercase tracking-widest text-ink/50 mb-1">
                    {t('connect_bot.desc_label', 'Bot Description (Optional)')}
                  </label>
                  <textarea
                    id="botDesc"
                    {...register('botDesc')}
                    placeholder={t('connect_bot.desc_placeholder', 'Enter a brief description')}
                    rows={2}
                    className="w-full px-4 py-3 border-2 border-ink shadow-brutal-sm font-['JetBrains_Mono',monospace] text-sm font-bold text-ink focus:outline-none focus:ring-2 focus:ring-ink transition-all resize-none"
                    disabled={createBotMutation.isPending}
                  />
                </div>

                {validationError && (
                  <div className="text-ink font-['JetBrains_Mono',monospace] text-xs flex gap-1.5 items-center font-bold bg-amber-300 p-3 rounded-none border-2 border-ink shadow-brutal">
                    <AlertCircle size={14} className="shrink-0 text-ink" />
                    <span>{validationError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={createBotMutation.isPending}
                  className="w-full bg-ink text-canvas font-['JetBrains_Mono',monospace] text-xs sm:text-sm font-extrabold uppercase tracking-wider px-8 py-4 border-2 border-ink shadow-brutal hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {createBotMutation.isPending ? (
                    <>
                      <Loader2 className="animate-spin text-canvas" size={16} />
                      <span className="text-canvas">{t('connect_bot.btn_connecting', 'Connecting...')}</span>
                    </>
                  ) : (
                    <span>{t('connect_bot.btn_connect', 'Connect')}</span>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
