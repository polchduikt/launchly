import React from 'react';
import { useAiAssistant } from '../hooks/useAiAssistant';
import { QUICK_QUESTIONS, AI_FLOW_TEMPLATES } from '../config';
import { Sparkles, X, Send, Bot, User, Loader2, RefreshCw, AlertCircle, AlertTriangle } from 'lucide-react';

export const AiAssistantDrawer: React.FC = () => {
  const {
    isOpen,
    setIsOpen,
    messages,
    activeTab,
    setActiveTab,
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

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-50 transition-opacity duration-300 animate-fadeIn"
        onClick={() => setIsOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 w-full sm:w-[460px] bg-slate-50 border-l border-slate-200 shadow-2xl flex flex-col z-50 transition-transform duration-300 ease-out animate-slideIn">
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col gap-3.5 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Sparkles size={18} className="animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Launchly AI Copilot</h3>
                <p className="text-[10px] text-slate-400 font-semibold">Online • Powered by Groq</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {onGenerate && (
            <div className="flex bg-slate-100 p-1 rounded-xl select-none">
              <button
                onClick={() => setActiveTab('chat')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeTab === 'chat'
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                AI Assistant
              </button>
              <button
                onClick={() => setActiveTab('generator')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeTab === 'generator'
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                AI Flow Generator
              </button>
            </div>
          )}

          <div className="bg-slate-50 border border-slate-200/60 p-2.5 rounded-xl text-xs">
            {isUsageLoading ? (
              <div className="flex items-center justify-center gap-1.5 py-1 text-slate-400">
                <Loader2 size={12} className="animate-spin" />
                <span className="font-semibold text-[10px]">Loading AI usage details...</span>
              </div>
            ) : usage ? (
              <div className="space-y-1.5">
                <div className="flex justify-between items-center font-bold text-[10px] text-slate-500 uppercase tracking-wider">
                  <span>Daily AI Requests</span>
                  <span>
                    {usage.requestsLimit === -1 ? (
                      <span className="text-indigo-600">Unlimited (Pro)</span>
                    ) : (
                      `${usage.requestsUsed} / ${usage.requestsLimit}`
                    )}
                  </span>
                </div>
                {usage.requestsLimit > 0 && (
                  <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isLimitReached
                          ? 'bg-rose-500'
                          : usage.requestsUsed / usage.requestsLimit > 0.8
                          ? 'bg-amber-500'
                          : 'bg-indigo-600'
                      }`}
                      style={{
                        width: `${Math.min(100, (usage.requestsUsed / usage.requestsLimit) * 100)}%`,
                      }}
                    />
                  </div>
                )}
                {usage.requestsLimit > 0 && !isLimitReached && (
                  <p className="text-[9px] text-slate-400 font-medium leading-normal">
                    Limit resets every 24 hours. Free tier gets 20 chat & schema generations per day.
                  </p>
                )}
                {isLimitReached && (
                  <div className="flex items-start gap-1.5 text-rose-600 bg-rose-50 border border-rose-100 p-2 rounded-lg mt-1">
                    <AlertCircle size={14} className="shrink-0 mt-0.5" />
                    <span className="text-[9px] font-bold">
                      You have reached the daily limit. Please upgrade to Pro for unlimited requests.
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between text-slate-400">
                <span>Failed to load usage</span>
                <button
                  onClick={() => refetchUsage()}
                  className="p-1 hover:bg-slate-200 rounded cursor-pointer"
                >
                  <RefreshCw size={10} />
                </button>
              </div>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {activeTab === 'chat' ? (
            <>
              {messages.map((msg, index) => {
                const isAI = msg.role === 'assistant';
                return (
                  <div
                    key={index}
                    className={`flex gap-3 max-w-[85%] ${isAI ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
                  >
                    <div
                      className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center border text-xs shadow-sm ${
                        isAI
                          ? 'bg-indigo-50 border-indigo-100 text-indigo-600'
                          : 'bg-white border-slate-200 text-slate-600'
                      }`}
                    >
                      {isAI ? <Bot size={14} /> : <User size={14} />}
                    </div>

                    <div
                      className={`p-3 rounded-2xl text-xs leading-relaxed break-words shadow-sm border ${
                        isAI
                          ? 'bg-white border-slate-200/80 text-slate-700 rounded-tl-none'
                          : 'bg-indigo-600 border-indigo-700 text-white rounded-tr-none'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                );
              })}

              {chatMutation.isPending && (
                <div className="flex gap-3 max-w-[85%] mr-auto">
                  <div className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center border bg-indigo-50 border-indigo-100 text-indigo-600 shadow-sm">
                    <Bot size={14} />
                  </div>
                  <div className="bg-white border border-slate-200/80 p-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              )}

              {messages.length <= 2 && !chatMutation.isPending && (
                <div className="pt-4 space-y-2 select-none">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Quick Prompts
                  </span>
                  <div className="grid grid-cols-1 gap-2">
                    {QUICK_QUESTIONS.map((q) => (
                      <button
                        key={q}
                        disabled={isLimitReached}
                        onClick={() => handleQuickQuestion(q)}
                        className="w-full text-left p-2.5 bg-white hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-200 rounded-xl text-[11px] font-semibold text-slate-600 hover:text-indigo-700 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {q}
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
                  <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-500">
                    <AlertTriangle size={24} className="animate-pulse" />
                  </div>
                  <div className="space-y-1.5 max-w-[280px]">
                    <h4 className="text-xs font-bold text-slate-800">Overwrite Canvas?</h4>
                    <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">
                      You already have nodes on your constructor canvas. Generating a new flow with AI will completely replace all existing blocks. This cannot be undone.
                    </p>
                  </div>
                  <div className="flex gap-2 w-full max-w-[280px] pt-2">
                    <button
                      onClick={() => setConfirmOverwrite(false)}
                      className="px-4 py-2 hover:bg-slate-100 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl transition-all cursor-pointer flex-1"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleGenerate}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex-1"
                    >
                      Yes, Overwrite
                    </button>
                  </div>
                </div>
              )}

              {schemaMutation.isPending && (
                <div className="space-y-4 py-16 flex flex-col items-center justify-center">
                  <Loader2 className="animate-spin text-indigo-600" size={32} />
                  <div className="space-y-1 text-center">
                    <h4 className="text-xs font-bold text-slate-800 animate-pulse">AI is generating flow...</h4>
                    <p className="text-[10px] text-slate-400 font-semibold">
                      Structuring nodes, connecting edges, and validating Start block.
                    </p>
                  </div>
                </div>
              )}

              {!confirmOverwrite && !schemaMutation.isPending && (
                <div className="space-y-5">
                  <div className="text-xs text-slate-500 leading-relaxed font-semibold">
                    Describe the bot flow you want to build. Launchly AI will automatically generate the appropriate layout, blocks, and connections.
                  </div>

                  {schemaMutation.isError && (
                    <div className="flex items-start gap-2 text-rose-600 bg-rose-50 border border-rose-100 p-3 rounded-2xl text-xs font-bold leading-normal animate-in fade-in slide-in-from-top-1">
                      <AlertCircle size={16} className="shrink-0 mt-0.5" />
                      <div>
                        {schemaMutation.error instanceof Error
                          ? schemaMutation.error.message
                          : 'Failed to generate bot schema. Please check your prompt and try again.'}
                      </div>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Describe Bot Flow
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      disabled={isLimitReached}
                      rows={5}
                      placeholder="E.g., A lead capture bot that greets the user, asks for their contact phone, registers a lead, and tags them as 'interested'..."
                      className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-xs font-medium focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Quick Start Templates
                    </span>
                    <div className="grid grid-cols-1 gap-2 select-none">
                      {AI_FLOW_TEMPLATES.map((tpl) => (
                        <button
                          key={tpl.title}
                          disabled={isLimitReached}
                          onClick={() => setDescription(tpl.text)}
                          className="w-full text-left p-3 bg-white hover:bg-indigo-50/40 border border-slate-200/80 hover:border-indigo-200 rounded-2xl transition-all cursor-pointer group disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span className="text-[11px] font-bold text-slate-700 group-hover:text-indigo-600 block mb-0.5">
                            {tpl.title}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium line-clamp-1 group-hover:text-indigo-600/80">
                            {tpl.text}
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
          <footer className="bg-white border-t border-slate-200 p-4 shrink-0">
            <div className="flex gap-2 relative items-center">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLimitReached || chatMutation.isPending}
                placeholder={
                  isLimitReached
                    ? 'Daily request limit reached'
                    : 'Ask Launchly AI something...'
                }
                className="flex-1 bg-slate-50 disabled:bg-slate-100 border border-slate-200/80 rounded-xl px-4 py-3 pr-10 text-xs font-medium focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-400"
              />
              <button
                onClick={() => handleSend()}
                disabled={isLimitReached || chatMutation.isPending || !inputValue.trim()}
                className="absolute right-2 p-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white disabled:text-slate-400 rounded-lg transition-all cursor-pointer disabled:cursor-not-allowed flex items-center justify-center"
              >
                <Send size={12} />
              </button>
            </div>
          </footer>
        ) : (
          !confirmOverwrite && !schemaMutation.isPending && (
            <footer className="bg-white border-t border-slate-200 p-4 shrink-0 flex gap-2.5 justify-end">
              <button
                onClick={() => setDescription('')}
                className="px-4 py-2.5 hover:bg-slate-100 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Clear
              </button>
              <button
                disabled={!description.trim() || isLimitReached}
                onClick={handleGenerate}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-bold rounded-xl transition-all cursor-pointer disabled:cursor-not-allowed"
              >
                <Sparkles size={12} />
                <span>Generate Bot Flow</span>
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
