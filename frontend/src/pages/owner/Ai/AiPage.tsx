import React, { useEffect, useRef } from 'react';
import { useAiStore } from '../../../store/useAiStore';
import { useAiAssistant } from '../../../hooks/ai/useAiAssistant';
import { QUICK_QUESTIONS } from '../../../const/aiConfig';
import { t } from '../../../i18n/config';
import { DashboardLayout } from '../../../components/layout/DashboardLayout';
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
      <div className="h-[calc(100vh-4rem)] flex flex-col bg-[#F2EBDD] font-['Geist',sans-serif] overflow-hidden">

        <header className="bg-[#F2EBDD] border-b-2 border-[#0A0A0A] px-6 py-4 flex flex-row justify-between items-center gap-4 shrink-0 z-10 font-['JetBrains_Mono',monospace]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white border-2 border-[#0A0A0A] flex items-center justify-center text-[#0A0A0A]">
              <Sparkles size={18} className="animate-pulse text-indigo-600" />
            </div>
            <div>
              <h1 className="font-['Anybody',sans-serif] text-lg font-black text-[#0A0A0A] uppercase tracking-tight select-none">Launchly AI</h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-white border-2 border-[#0A0A0A] px-3.5 py-1.5 rounded-xl text-xs min-w-[160px] select-none">
              {isUsageLoading ? (
                <div className="flex items-center justify-center gap-1.5 py-0.5 text-[#0A0A0A]">
                  <Loader2 size={12} className="animate-spin" />
                  <span className="font-bold text-[9px] uppercase tracking-wider">{t('ai.drawer.usage.loading')}</span>
                </div>
              ) : usage ? (
                <div className="space-y-1">
                  <div className="flex justify-between items-center font-black text-[9px] text-[#0A0A0A] uppercase tracking-widest leading-none">
                    <span>{t('ai.drawer.usage.tokens_remaining')}</span>
                    <span className={`font-mono font-black ${
                      usage.remainingPercentage <= 10 ? 'text-rose-600' : usage.remainingPercentage <= 30 ? 'text-amber-600' : 'text-indigo-700'
                    }`}>
                      {usage.remainingPercentage}%
                    </span>
                  </div>
                  <div className="h-2 w-full bg-[#F2EBDD] border border-[#0A0A0A] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        usage.remainingPercentage <= 10
                          ? 'bg-rose-500'
                          : usage.remainingPercentage <= 30
                          ? 'bg-amber-500'
                          : 'bg-indigo-600'
                      }`}
                      style={{
                        width: `${Math.max(0, Math.min(100, usage.remainingPercentage))}%`,
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between text-[#0A0A0A]">
                  <span className="text-[9px] font-bold">{t('ai.drawer.usage.failed_load')}</span>
                  <button onClick={() => refetchUsage()} className="p-0.5 hover:bg-[#F2EBDD] rounded cursor-pointer">
                    <RefreshCw size={10} />
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={clearMessages}
              title={t('ai.drawer.clear_history_tooltip')}
              className="p-2 bg-white hover:bg-[#0A0A0A] hover:text-[#F2EBDD] text-[#0A0A0A] rounded-xl transition-all border-2 border-[#0A0A0A] cursor-pointer"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5 flex flex-col font-['JetBrains_Mono',monospace]">
          <div className="flex-1 space-y-5 max-w-4xl w-full mx-auto flex flex-col justify-end">
            
            <div className="space-y-5 overflow-y-auto flex-1 pr-1.5 custom-scrollbar">
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
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border-2 border-[#0A0A0A] select-none font-bold ${
                        isUser
                          ? 'bg-[#0A0A0A] text-[#F2EBDD]'
                          : 'bg-white text-[#0A0A0A]'
                      }`}
                    >
                      {isUser ? <User size={16} /> : <Bot size={16} />}
                    </div>

                    <div
                      className={`p-4 rounded-2xl text-xs leading-relaxed border-2 border-[#0A0A0A] break-words overflow-hidden ${
                        isUser
                          ? 'bg-[#0A0A0A] text-[#F2EBDD] rounded-tr-none'
                          : 'bg-white text-[#0A0A0A] rounded-tl-none'
                      }`}
                    >
                      <span className="whitespace-pre-line font-bold break-all">{msg.content}</span>
                    </div>
                  </div>
                );
              })}

              {chatMutation.isPending && (
                <div className="flex items-start gap-3.5 max-w-[85%] animate-pulse">
                  <div className="w-9 h-9 rounded-xl bg-white border-2 border-[#0A0A0A] text-[#0A0A0A] flex items-center justify-center shrink-0">
                    <Bot size={16} />
                  </div>
                  <div className="p-4 rounded-2xl bg-white text-[#0A0A0A] border-2 border-[#0A0A0A] rounded-tl-none flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin text-[#0A0A0A]" />
                    <span className="text-[11px] font-extrabold uppercase">{t('ai.drawer.composing')}</span>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {messages.length === 1 && !chatMutation.isPending && (
              <div className="pt-6 border-t-2 border-[#0A0A0A]/15 select-none max-w-2xl mx-auto w-full">
                <p className="text-[10px] font-black text-[#0A0A0A] uppercase tracking-widest mb-3 text-center">
                  {t('ai.drawer.suggested_questions')}
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {QUICK_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      onClick={() => handleQuickQuestion(t(q))}
                      className="px-4 py-2 bg-white hover:bg-[#0A0A0A] hover:text-[#F2EBDD] border-2 border-[#0A0A0A] rounded-xl text-[11px] font-bold text-[#0A0A0A] transition-all cursor-pointer"
                    >
                      {t(q)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <footer className="bg-transparent px-6 pb-7 pt-2 shrink-0 relative font-['JetBrains_Mono',monospace]">
          <div className="max-w-4xl mx-auto space-y-2.5">
            {isLimitReached && (
              <div className="flex items-start gap-2 text-rose-800 bg-rose-200 border-2 border-[#0A0A0A] p-2.5 rounded-xl">
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                <span className="text-[10px] font-black uppercase">
                  {t('ai.drawer.usage.limit_reached')}
                </span>
              </div>
            )}

            <div className="flex items-end bg-white border-2 border-[#0A0A0A] rounded-2xl transition-all p-2 w-full gap-2">
              <textarea
                ref={textareaRef}
                rows={1}
                disabled={isLimitReached || chatMutation.isPending}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isLimitReached ? t('ai.drawer.chat_limit_reached') : t('ai.drawer.chat_placeholder')}
                className="flex-1 bg-transparent pl-3 py-2 text-xs font-bold text-[#0A0A0A] focus:outline-none transition-all placeholder:text-slate-500 disabled:opacity-55 disabled:cursor-not-allowed resize-none max-h-40 overflow-y-auto leading-relaxed"
              />
              <button
                disabled={!inputValue.trim() || isLimitReached || chatMutation.isPending}
                onClick={() => handleSend()}
                className="w-9 h-9 bg-[#0A0A0A] hover:bg-indigo-700 text-[#F2EBDD] rounded-xl border border-[#0A0A0A] flex items-center justify-center transition-all cursor-pointer disabled:bg-slate-200 disabled:text-slate-500 disabled:cursor-not-allowed shrink-0 mb-0.5"
                title="Send message"
              >
                <Send size={14} className="stroke-[2.5]" />
              </button>
            </div>
          </div>
        </footer>

      </div>
    </DashboardLayout>
  );
};

export default AiPage;
