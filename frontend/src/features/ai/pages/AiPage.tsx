import React, { useEffect, useRef } from 'react';
import { useAiStore } from '../../../store/useAiStore';
import { useAiAssistant } from '../hooks/useAiAssistant';
import { QUICK_QUESTIONS } from '../config';
import { t } from '../../../i18n/config';
import { DashboardLayout } from '../../../components/layouts/DashboardLayout';
import { Sparkles, Send, Bot, User, Loader2, RefreshCw, AlertCircle, Trash2 } from 'lucide-react';

const AiPage: React.FC = () => {
  const {
    messages,
    clearMessages,
    setActiveTab,
    setOnGenerate,
    setIsOpen,
  } = useAiStore();

  const {
    inputValue,
    setInputValue,
    isUsageLoading,
    usage,
    isLimitReached,
    chatMutation,
    messagesEndRef,
    refetchUsage,
    handleSend,
    handleKeyDown,
    handleQuickQuestion,
  } = useAiAssistant();

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [inputValue]);

  useEffect(() => {
    setIsOpen(false);
    setActiveTab('chat');
    setOnGenerate(null);
  }, [setIsOpen, setActiveTab, setOnGenerate]);

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-4rem)] flex flex-col bg-slate-50 font-sans overflow-hidden">

        <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-row justify-between items-center gap-4 shrink-0 shadow-xs z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100">
              <Sparkles size={18} className="animate-pulse" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-800 tracking-tight leading-tight select-none">Launchly AI</h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl text-xs min-w-[160px] select-none">
              {isUsageLoading ? (
                <div className="flex items-center justify-center gap-1.5 py-0.5 text-slate-400">
                  <Loader2 size={10} className="animate-spin" />
                  <span className="font-bold text-[9px] uppercase tracking-wider">{t('ai.drawer.usage.loading')}</span>
                </div>
              ) : usage ? (
                <div className="space-y-1">
                  <div className="flex justify-between items-center font-extrabold text-[9px] text-slate-450 uppercase tracking-widest leading-none">
                    <span>{t('ai.drawer.usage.daily_requests')}</span>
                    <span>
                      {usage.requestsLimit === -1 ? (
                        <span className="text-indigo-600 font-black">{t('ai.drawer.usage.unlimited')}</span>
                      ) : (
                        `${usage.requestsUsed}/${usage.requestsLimit}`
                      )}
                    </span>
                  </div>
                  {usage.requestsLimit > 0 && (
                    <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isLimitReached ? 'bg-rose-500' : 'bg-indigo-650'
                        }`}
                        style={{
                          width: `${Math.min(100, (usage.requestsUsed / usage.requestsLimit) * 100)}%`,
                        }}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[9px] font-bold">{t('ai.drawer.usage.failed_load')}</span>
                  <button onClick={() => refetchUsage()} className="p-0.5 hover:bg-slate-200 rounded cursor-pointer">
                    <RefreshCw size={8} />
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={clearMessages}
              title={t('ai.drawer.clear_history_tooltip')}
              className="p-2 hover:bg-slate-100 hover:text-rose-600 text-slate-400 rounded-xl transition-all border border-slate-200 hover:border-slate-300 cursor-pointer shadow-3xs"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5 flex flex-col">
          <div className="flex-1 space-y-5 max-w-4xl w-full mx-auto flex flex-col justify-end">
            
            <div className="space-y-5 overflow-y-auto flex-1 pr-1.5 scrollbar-thin">
              {messages.map((msg, idx) => {
                const isUser = msg.role === 'user';
                return (
                  <div
                    key={idx}
                    className={`flex items-start gap-3.5 max-w-[85%] animate-fade-in ${
                      isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'
                    }`}
                  >

                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border select-none ${
                        isUser
                          ? 'bg-slate-100 border-slate-200 text-slate-600 shadow-sm'
                          : 'bg-white border-slate-200 text-slate-700 shadow-sm'
                      }`}
                    >
                      {isUser ? <User size={15} /> : <Bot size={15} />}
                    </div>

                    <div
                      className={`p-4 rounded-2xl text-xs leading-relaxed shadow-3xs border break-words overflow-hidden ${
                        isUser
                          ? 'bg-slate-100 text-slate-800 border-slate-200/60 rounded-tr-none'
                          : 'bg-white text-slate-800 border-slate-200/80 rounded-tl-none'
                      }`}
                    >
                      <span className="whitespace-pre-line font-medium break-all">{msg.content}</span>
                    </div>
                  </div>
                );
              })}

              {chatMutation.isPending && (
                <div className="flex items-start gap-3.5 max-w-[85%] animate-pulse">
                  <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 text-slate-700 flex items-center justify-center shrink-0 shadow-sm">
                    <Bot size={15} />
                  </div>
                  <div className="p-4 rounded-2xl bg-white text-slate-400 border border-slate-200/80 rounded-tl-none shadow-3xs flex items-center gap-2">
                    <Loader2 size={13} className="animate-spin text-slate-400" />
                    <span className="text-[11px] font-bold">{t('ai.drawer.composing')}</span>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {messages.length === 1 && !chatMutation.isPending && (
              <div className="pt-6 border-t border-slate-100 select-none max-w-2xl mx-auto w-full">
                <p className="text-[10px] font-extrabold text-slate-455 uppercase tracking-widest mb-3 text-center">
                  {t('ai.drawer.suggested_questions')}
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {QUICK_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      onClick={() => handleQuickQuestion(t(q))}
                      className="px-3.5 py-2 bg-white hover:bg-indigo-50/50 hover:text-indigo-700 border border-slate-200 hover:border-indigo-150 rounded-full text-[11px] font-bold text-slate-650 transition-all cursor-pointer shadow-3xs hover:shadow-2xs active:scale-95"
                    >
                      {t(q)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <footer className="bg-transparent px-6 pb-7 pt-2 shrink-0 relative">
          <div className="max-w-4xl mx-auto space-y-2.5">
            {isLimitReached && (
              <div className="flex items-start gap-2 text-rose-700 bg-rose-50 border border-rose-100 p-2.5 rounded-xl">
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                <span className="text-[10px] font-extrabold">
                  {t('ai.drawer.usage.limit_reached')}
                </span>
              </div>
            )}

            <div className="flex items-end bg-white border border-slate-200/80 rounded-2xl shadow-md focus-within:shadow-lg focus-within:border-indigo-500/80 transition-all p-2 w-full gap-2">
              <textarea
                ref={textareaRef}
                rows={1}
                disabled={isLimitReached || chatMutation.isPending}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isLimitReached ? t('ai.drawer.chat_limit_reached') : t('ai.drawer.chat_placeholder')}
                className="flex-1 bg-transparent pl-3 py-2 text-xs font-medium focus:outline-none transition-all placeholder:text-slate-400 disabled:opacity-55 disabled:cursor-not-allowed resize-none max-h-40 overflow-y-auto leading-relaxed"
              />
              <button
                disabled={!inputValue.trim() || isLimitReached || chatMutation.isPending}
                onClick={() => handleSend()}
                className="w-8.5 h-8.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-sm disabled:bg-slate-100 disabled:text-slate-450 disabled:shadow-none disabled:cursor-not-allowed shrink-0 mb-0.5"
                title="Send message"
              >
                <Send size={13} className="stroke-[2.5]" />
              </button>
            </div>
          </div>
        </footer>

      </div>
    </DashboardLayout>
  );
};

export default AiPage;
