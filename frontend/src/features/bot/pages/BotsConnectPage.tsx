import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import logo from '../../../assets/logo.png';
import { useCreateBotMutation } from '../hooks/useBotMutations';
import { useBotsQuery } from '../hooks/useBotsQuery';
import { AlertCircle, ArrowLeft, Loader2, Sparkles, MessageCircle, Send, Check } from 'lucide-react';

const botSchema = z.object({
  botName: z.string().min(1, 'Bot name is required'),
  botToken: z.string().min(1, 'Telegram bot token is required'),
  botDesc: z.string().optional(),
});

type BotFormValues = z.infer<typeof botSchema>;

export const BotsConnectPage: React.FC = () => {
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

  const handleConnect = (data: BotFormValues) => {
    setValidationError(null);

    createBotMutation.mutate(
      {
        name: data.botName.trim(),
        telegramToken: data.botToken.trim(),
        description: data.botDesc?.trim() || undefined,
      },
      {
        onSuccess: () => {
          navigate('/home');
        },
        onError: (err: unknown) => {
          const errMsg = axios.isAxiosError(err)
            ? (err.response?.data?.message ?? 'Failed to connect bot. Please verify your token.')
            : (err instanceof Error ? err.message : 'Something went wrong');
          setValidationError(errMsg);
        },
      }
    );
  };

  const handleBack = () => {
    if (step === 3) setStep(2);
    else if (step === 2) setStep(1);
    else if (hasBots) navigate('/home');
    else navigate('/');
  };


  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row overflow-hidden font-sans">
      <div className="w-full md:w-5/12 bg-white border-b md:border-b-0 md:border-r border-slate-200 p-8 md:p-16 flex flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-60 pointer-events-none" />
        
        <div
          onClick={() => hasBots && navigate('/home')}
          className={`flex items-center mb-12 select-none ${hasBots ? 'cursor-pointer' : ''}`}
        >
          <img src={logo} alt="Launchly Logo" className="h-14 w-auto object-contain" />
        </div>

        <div className="my-auto space-y-6 relative z-10">
          {step === 1 && (
            <>
              <div className="w-24 h-24 rounded-2xl bg-indigo-50 bg-radial-gradient flex items-center justify-center text-indigo-600 mb-8 border border-indigo-100 shadow-sm shadow-indigo-100/50">
                <Sparkles size={40} />
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
                Where would you like to start?
              </h1>
              <p className="text-slate-500 text-base leading-relaxed max-w-sm">
                Don't worry, you can connect other communication channels later.
              </p>
            </>
          )}

          {step === 2 && (
            <>
              <div className="w-24 h-24 rounded-2xl bg-sky-50 flex items-center justify-center text-sky-500 mb-8 border border-sky-100 shadow-sm">
                <Send size={40} />
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
                Let's connect Telegram bot to Launchly
              </h1>
              <p className="text-slate-500 text-base leading-relaxed max-w-sm">
                You can create a brand new bot using BotFather or connect your existing one.
              </p>
            </>
          )}

          {step === 3 && (
            <>
              <div className="w-24 h-24 rounded-2xl bg-green-50 flex items-center justify-center text-green-600 mb-8 border border-green-100 shadow-sm">
                <Check size={40} />
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
                Choose your favourite bot and rock it!
              </h1>
              <p className="text-slate-500 text-base leading-relaxed max-w-sm">
                Just follow the quick step-by-step instructions to connect an existing Telegram bot.
              </p>
            </>
          )}
        </div>

        <div className="mt-12 md:mt-0">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
            {step === 1 ? 'Back' : step === 2 ? 'Choose Another Channel' : 'Back'}
          </button>
        </div>
      </div>

      <div className="flex-1 p-8 md:p-16 flex items-center justify-center overflow-y-auto max-h-screen">
        <div className="w-full max-w-md my-auto">
          {step === 1 && (
            <div className="space-y-4">
              <button
                onClick={() => setStep(2)}
                className="w-full bg-white border border-slate-200 hover:border-sky-300 hover:bg-sky-50/20 p-5 rounded-2xl transition-all text-left flex items-center gap-4 group cursor-pointer shadow-sm hover:shadow"
              >
                <span className="w-12 h-12 rounded-xl bg-sky-100 text-sky-500 flex items-center justify-center shrink-0">
                  <Send size={24} />
                </span>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-900 group-hover:text-sky-600 transition-colors">Telegram</h3>
                  <p className="text-xs text-slate-500 truncate">Power up your business with Telegram automation.</p>
                </div>
              </button>

              {[
                { name: 'Instagram', color: 'bg-pink-50 text-pink-500', desc: 'Supercharge your social media marketing with Instagram Automation.' },
                { name: 'WhatsApp', color: 'bg-emerald-50 text-emerald-500', desc: 'Choose the most popular mobile messaging app and reach 2 billion users.' },
                { name: 'Facebook Messenger', color: 'bg-blue-50 text-blue-500', desc: 'Create Facebook Messenger automation to keep customers happy.' }
              ].map((c) => (
                <div
                  key={c.name}
                  className="w-full bg-white/70 border border-slate-200 p-5 rounded-2xl flex items-center gap-4 select-none opacity-60 relative group"
                >
                  <span className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${c.color}`}>
                    <MessageCircle size={24} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-700">{c.name}</h3>
                    <p className="text-xs text-slate-500 truncate">{c.desc}</p>
                  </div>
                  <span className="absolute right-4 top-4 text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                    Coming Soon
                  </span>
                </div>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
              <h2 className="text-xl font-extrabold text-slate-900 mb-2">How do you want to start?</h2>
              <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                In each scenario, we will guide you through easy step-by-step instructions.
              </p>
              
              <div className="space-y-3">
                <button
                  onClick={() => setStep(3)}
                  className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-all shadow-sm shadow-indigo-100 cursor-pointer"
                >
                  Connect Existing Bot
                </button>
                <a
                  href="https://t.me/BotFather"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full block py-3 px-4 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-sm text-center transition-all cursor-pointer"
                >
                  + Create New Bot
                </a>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
              <h2 className="text-xl font-extrabold text-slate-900 mb-4">Connect existing Telegram bot</h2>
              
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex gap-3 text-amber-800 text-xs mb-6 leading-relaxed">
                <AlertCircle size={16} className="shrink-0 text-amber-500" />
                <span>
                  We highly recommend you not to use the same token for different services, otherwise the bot will work incorrectly.
                </span>
              </div>

              <div className="space-y-4 mb-6">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Instructions:</h4>
                <ol className="space-y-3 text-sm text-slate-700">
                  <li className="flex gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 text-xs font-bold flex items-center justify-center shrink-0">1</span>
                    <span>
                      Open{' '}
                      <a
                        href="https://t.me/BotFather"
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-600 font-semibold hover:underline"
                      >
                        @BotFather
                      </a>{' '}
                      in Telegram and click <code className="bg-slate-50 px-1 py-0.5 rounded text-xs border border-slate-200">/start</code>
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 text-xs font-bold flex items-center justify-center shrink-0">2</span>
                    <span>Send <code className="bg-slate-50 px-1 py-0.5 rounded text-xs border border-slate-200">/mybots</code> and choose the bot you want to connect</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 text-xs font-bold flex items-center justify-center shrink-0">3</span>
                    <span>Copy its API token and paste it below</span>
                  </li>
                </ol>
              </div>

              <form onSubmit={handleSubmit(handleConnect)} className="space-y-4">
                <div>
                  <label htmlFor="botName" className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">
                    Bot Name
                  </label>
                  <input
                    id="botName"
                    type="text"
                    {...register('botName')}
                    placeholder="Enter your bot name (e.g. SupportBot)"
                    className={`w-full px-4 py-2.5 rounded-xl border ${errors.botName ? 'border-rose-300 focus:border-rose-500' : 'border-slate-200 focus:border-indigo-500'} focus:outline-none text-sm transition-all`}
                    disabled={createBotMutation.isPending}
                  />
                  {errors.botName && (
                    <span className="text-rose-600 text-xs mt-1 block">{errors.botName.message}</span>
                  )}
                </div>

                <div>
                  <label htmlFor="botToken" className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">
                    Telegram bot token
                  </label>
                  <input
                    id="botToken"
                    type="text"
                    {...register('botToken')}
                    placeholder="Enter token (e.g. 123456:ABC-DEF...)"
                    className={`w-full px-4 py-2.5 rounded-xl border ${errors.botToken ? 'border-rose-300 focus:border-rose-500' : 'border-slate-200 focus:border-indigo-500'} focus:outline-none text-sm transition-all`}
                    disabled={createBotMutation.isPending}
                  />
                  {errors.botToken && (
                    <span className="text-rose-600 text-xs mt-1 block">{errors.botToken.message}</span>
                  )}
                </div>

                <div>
                  <label htmlFor="botDesc" className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">
                    Bot Description (Optional)
                  </label>
                  <textarea
                    id="botDesc"
                    {...register('botDesc')}
                    placeholder="Enter a brief description"
                    rows={2}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-sm transition-all resize-none"
                    disabled={createBotMutation.isPending}
                  />
                </div>

                {validationError && (
                  <div className="text-rose-600 text-xs flex gap-1.5 items-center font-medium bg-rose-50 p-3 rounded-xl border border-rose-100">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>{validationError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={createBotMutation.isPending}
                  className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {createBotMutation.isPending ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      <span>Connecting...</span>
                    </>
                  ) : (
                    <span>Connect</span>
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
