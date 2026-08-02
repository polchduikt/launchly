import React, { useEffect, useRef } from 'react';
import { useAiAssistant } from '../../hooks/ai/useAiAssistant';
import { QUICK_QUESTIONS, AI_FLOW_TEMPLATES } from '../../const/aiConfig';
import { Sparkles, X, Send, Bot, User, Loader2, RefreshCw, AlertCircle, AlertTriangle } from 'lucide-react';
import { t } from '../../i18n/config';

export const AiAssistantDrawer: React.FC = () => {
  const {
    isOpen,
    setIsOpen,
    messages,
    activeTab,
    onGenerate,
    inputValue,
    setInputValue,
    description,
    setDescription,
    confirmOverwrite,
    setConfirmOverwrite,
    isUsageLoading,
    usage,
    isLimitReached,
    chatMutation,
    schemaMutation,
    messagesEndRef,
    refetchUsage,
    handleSend,
    handleGenerate,
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

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-[#0A0A0A]/40 z-50 transition-opacity duration-300 animate-fadeIn"
        onClick={() => setIsOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 w-full sm:w-[480px] bg-[#F2EBDD] border-l-2 border-[#0A0A0A] shadow-2xl flex flex-col z-50 transition-transform duration-300 ease-out animate-slideIn font-['JetBrains_Mono',monospace] text-[#0A0A0A]">
        <header className="bg-[#F2EBDD] border-b-2 border-[#0A0A0A] px-6 py-4 flex flex-col gap-3.5 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-purple-200 border-2 border-[#0A0A0A] flex items-center justify-center text-[#0A0A0A]">
                <Sparkles size={18} className="animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-black text-[#0A0A0A] uppercase tracking-wider font-['Anybody',sans-serif]">
                  {onGenerate ? t('ai.drawer.title.generator') : t('ai.drawer.title.copilot')}
                </h3>
                <p className="text-[10px] text-[#0A0A0A]/70 font-bold uppercase">{t('ai.drawer.online_status')}</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 bg-[#F2EBDD] hover:bg-[#0A0A0A] hover:text-[#F2EBDD] border-2 border-[#0A0A0A] rounded-xl text-[#0A0A0A] transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          <div className="bg-white border-2 border-[#0A0A0A] p-3 rounded-2xl text-xs">
            {isUsageLoading ? (
              <div className="flex items-center justify-center gap-1.5 py-1 text-[#0A0A0A]/60">
                <Loader2 size={12} className="animate-spin" />
                <span className="font-bold text-[10px] uppercase">{t('ai.drawer.usage.loading')}</span>
              </div>
            ) : usage ? (
              <div className="space-y-1.5">
                <div className="flex justify-between items-center font-black text-[10px] text-[#0A0A0A] uppercase tracking-wider">
                  <span>{t('ai.drawer.usage.tokens_remaining')}</span>
                  <span className="font-mono font-black text-xs">
                    {usage.remainingPercentage}%
                  </span>
                </div>
                <div className="h-2.5 w-full bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      usage.remainingPercentage <= 10
                        ? 'bg-rose-500'
                        : usage.remainingPercentage <= 30
                        ? 'bg-amber-500'
                        : 'bg-[#0A0A0A]'
                    }`}
                    style={{
                      width: `${Math.max(0, Math.min(100, usage.remainingPercentage))}%`,
                    }}
                  />
                </div>
                {!isLimitReached && (
                  <p className="text-[10px] text-[#0A0A0A]/70 font-bold leading-normal mt-1">
                    {t('ai.drawer.usage.limit_desc')}
                  </p>
                )}
                {isLimitReached && (
                  <div className="flex items-start gap-1.5 text-rose-800 bg-rose-200 border-2 border-[#0A0A0A] p-2 rounded-xl mt-1">
                    <AlertCircle size={14} className="shrink-0 mt-0.5" />
                    <span className="text-[10px] font-black uppercase">
                      {t('ai.drawer.usage.limit_reached')}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between text-[#0A0A0A]/60 font-bold">
                <span>{t('ai.drawer.usage.failed_load')}</span>
                <button
                  onClick={() => refetchUsage()}
                  className="p-1 hover:bg-[#0A0A0A] hover:text-[#F2EBDD] border border-[#0A0A0A] rounded cursor-pointer"
                >
                  <RefreshCw size={10} />
                </button>
              </div>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 custom-scrollbar">
          {activeTab === 'chat' && !onGenerate ? (
            <>
              {messages.map((msg, index) => {
                const isAI = msg.role === 'assistant';
                return (
                  <div
                    key={index}
                    className={`flex gap-3 max-w-[88%] ${isAI ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
                  >
                    <div
                      className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center border-2 border-[#0A0A0A] text-xs font-bold ${
                        isAI
                          ? 'bg-purple-200 text-[#0A0A0A]'
                          : 'bg-[#0A0A0A] text-[#F2EBDD]'
                      }`}
                    >
                      {isAI ? <Bot size={15} /> : <User size={15} />}
                    </div>

                    <div
                      className={`p-3.5 rounded-2xl text-xs leading-relaxed break-words border-2 border-[#0A0A0A] ${
                        isAI
                          ? 'bg-white text-[#0A0A0A] rounded-tl-none font-medium'
                          : 'bg-[#0A0A0A] text-[#F2EBDD] rounded-tr-none font-bold'
                      }`}
                    >
                      <span className="break-all">{msg.content}</span>
                    </div>
                  </div>
                );
              })}

              {chatMutation.isPending && (
                <div className="flex gap-3 max-w-[85%] mr-auto">
                  <div className="w-8 h-8 rounded-xl shrink-0 flex items-center justify-center border-2 border-[#0A0A0A] bg-purple-200 text-[#0A0A0A]">
                    <Bot size={15} />
                  </div>
                  <div className="bg-white border-2 border-[#0A0A0A] p-3 rounded-2xl rounded-tl-none flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-[#0A0A0A] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 bg-[#0A0A0A] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 bg-[#0A0A0A] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              )}

              {messages.length <= 2 && !chatMutation.isPending && (
                <div className="pt-4 space-y-2 select-none">
                  <span className="text-[10px] font-black text-[#0A0A0A] uppercase tracking-wider font-['Anybody',sans-serif]">
                    {t('ai.drawer.quick_prompts')}
                  </span>
                  <div className="grid grid-cols-1 gap-2">
                    {QUICK_QUESTIONS.map((q) => (
                      <button
                        key={q}
                        disabled={isLimitReached}
                        onClick={() => handleQuickQuestion(t(q))}
                        className="w-full text-left p-3 bg-white hover:bg-[#0A0A0A] hover:text-[#F2EBDD] border-2 border-[#0A0A0A] rounded-2xl text-xs font-bold text-[#0A0A0A] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group"
                      >
                        {t(q)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </>
          ) : (
            <>
              {confirmOverwrite && !schemaMutation.isPending && (
                <div className="space-y-4 py-6 flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-2xl bg-rose-200 border-2 border-[#0A0A0A] flex items-center justify-center text-[#0A0A0A]">
                    <AlertTriangle size={24} className="animate-pulse" />
                  </div>
                  <div className="space-y-1.5 max-w-[300px]">
                    <h4 className="text-xs font-black text-[#0A0A0A] uppercase tracking-wider font-['Anybody',sans-serif]">{t('ai.drawer.overwrite.title')}</h4>
                    <p className="text-[11px] text-[#0A0A0A]/80 leading-relaxed font-bold">
                      {t('ai.drawer.overwrite.desc')}
                    </p>
                  </div>
                  <div className="flex gap-2.5 w-full max-w-[300px] pt-2">
                    <button
                      onClick={() => setConfirmOverwrite(false)}
                      className="px-4 py-2.5 bg-[#F2EBDD] hover:bg-[#0A0A0A] hover:text-[#F2EBDD] border-2 border-[#0A0A0A] text-[#0A0A0A] text-xs font-black rounded-xl transition-all cursor-pointer flex-1 uppercase"
                    >
                      {t('ai.drawer.overwrite.back')}
                    </button>
                    <button
                      onClick={handleGenerate}
                      className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 border-2 border-[#0A0A0A] text-[#F2EBDD] text-xs font-black rounded-xl transition-all cursor-pointer flex-1 uppercase"
                    >
                      {t('ai.drawer.overwrite.confirm')}
                    </button>
                  </div>
                </div>
              )}

              {schemaMutation.isPending && (
                <div className="space-y-4 py-16 flex flex-col items-center justify-center">
                  <Loader2 className="animate-spin text-[#0A0A0A]" size={36} />
                  <div className="space-y-1 text-center">
                    <h4 className="text-xs font-black text-[#0A0A0A] uppercase tracking-wider animate-pulse font-['Anybody',sans-serif]">{t('ai.drawer.loading.title')}</h4>
                    <p className="text-[11px] text-[#0A0A0A]/70 font-bold">
                      {t('ai.drawer.loading.desc')}
                    </p>
                  </div>
                </div>
              )}

              {!confirmOverwrite && !schemaMutation.isPending && (
                <div className="space-y-5">
                  <div className="text-xs text-[#0A0A0A]/80 leading-relaxed font-bold">
                    {t('ai.drawer.prompt_desc')}
                  </div>

                  {schemaMutation.isError && (
                    <div className="flex items-start gap-2 text-[#0A0A0A] bg-rose-200 border-2 border-[#0A0A0A] p-3 rounded-2xl text-xs font-bold leading-normal animate-in fade-in slide-in-from-top-1">
                      <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-800" />
                      <div>
                        {schemaMutation.error instanceof Error
                          ? schemaMutation.error.message
                          : t('ai.drawer.error_desc')}
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-[#0A0A0A] uppercase tracking-wider font-['Anybody',sans-serif]">
                      {t('ai.drawer.prompt_label')}
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      disabled={isLimitReached}
                      rows={5}
                      placeholder={t('ai.drawer.prompt_placeholder')}
                      className="w-full bg-white border-2 border-[#0A0A0A] rounded-2xl p-4 text-xs font-bold text-[#0A0A0A] focus:outline-none transition-colors placeholder:text-[#0A0A0A]/40 font-['JetBrains_Mono',monospace]"
                    />
                  </div>

                  <div className="space-y-2">
                    <span className="text-[10px] font-black text-[#0A0A0A] uppercase tracking-wider block font-['Anybody',sans-serif]">
                      {t('ai.drawer.quick_start')}
                    </span>
                    <div className="grid grid-cols-1 gap-2.5 select-none">
                      {AI_FLOW_TEMPLATES.map((tpl) => (
                        <button
                          key={tpl.titleKey}
                          disabled={isLimitReached}
                          onClick={() => setDescription(t(tpl.textKey))}
                          className="w-full text-left p-3.5 bg-white hover:bg-[#0A0A0A] hover:text-[#F2EBDD] border-2 border-[#0A0A0A] rounded-2xl transition-all cursor-pointer group disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span className="text-xs font-black text-[#0A0A0A] group-hover:text-[#F2EBDD] block mb-1 font-['Anybody',sans-serif] uppercase tracking-wider">
                            {t(tpl.titleKey)}
                          </span>
                          <span className="text-[10px] text-[#0A0A0A]/70 font-bold line-clamp-1 group-hover:text-[#F2EBDD]/80">
                            {t(tpl.textKey)}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {activeTab === 'chat' ? (
          <footer className="bg-[#F2EBDD] border-t-2 border-[#0A0A0A] p-4 shrink-0">
            <div className="flex gap-2 items-end bg-white border-2 border-[#0A0A0A] rounded-2xl p-2 w-full">
              <textarea
                ref={textareaRef}
                rows={1}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLimitReached || chatMutation.isPending}
                placeholder={
                  isLimitReached
                    ? t('ai.drawer.chat_limit_reached')
                    : t('ai.drawer.chat_placeholder')
                }
                className="flex-1 bg-transparent pl-2 py-1.5 text-xs font-bold text-[#0A0A0A] focus:outline-none resize-none max-h-32 overflow-y-auto leading-relaxed placeholder:text-[#0A0A0A]/40 disabled:opacity-55 disabled:cursor-not-allowed font-['JetBrains_Mono',monospace]"
              />
              <button
                onClick={() => handleSend()}
                disabled={isLimitReached || chatMutation.isPending || !inputValue.trim()}
                className="p-2.5 bg-[#0A0A0A] hover:bg-[#0A0A0A]/90 disabled:bg-[#0A0A0A]/20 text-[#F2EBDD] disabled:text-[#0A0A0A]/40 rounded-xl transition-all cursor-pointer disabled:cursor-not-allowed flex items-center justify-center shrink-0 mb-0.5 border-2 border-[#0A0A0A]"
              >
                <Send size={14} />
              </button>
            </div>
          </footer>
        ) : (
          !confirmOverwrite && !schemaMutation.isPending && (
            <footer className="bg-[#F2EBDD] border-t-2 border-[#0A0A0A] p-4 shrink-0 flex gap-3 justify-end">
              <button
                onClick={() => setDescription('')}
                className="px-4 py-2.5 bg-[#F2EBDD] hover:bg-[#0A0A0A] hover:text-[#F2EBDD] border-2 border-[#0A0A0A] text-[#0A0A0A] text-xs font-black rounded-xl transition-all cursor-pointer uppercase font-['Anybody',sans-serif]"
              >
                {t('ai.drawer.clear')}
              </button>
              <button
                disabled={!description.trim() || isLimitReached}
                onClick={handleGenerate}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-[#0A0A0A] hover:bg-[#0A0A0A]/90 disabled:bg-[#0A0A0A]/20 disabled:text-[#0A0A0A]/40 text-[#F2EBDD] text-xs font-black rounded-xl border-2 border-[#0A0A0A] transition-all cursor-pointer disabled:cursor-not-allowed uppercase tracking-wider font-['Anybody',sans-serif]"
              >
                <Sparkles size={14} />
                <span>{t('ai.drawer.generate_btn')}</span>
              </button>
            </footer>
          )
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out forwards;
        }
        .animate-slideIn {
          animation: slideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </>
  );
};
