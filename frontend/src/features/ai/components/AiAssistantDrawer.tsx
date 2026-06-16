import React, { useEffect, useRef, useState } from 'react';
import { useAiStore } from '../../../store/useAiStore';
import { useAiUsageQuery, useAiChatMutation } from '../hooks/useAiQueries';
import { Sparkles, X, Send, Bot, User, Loader2, RefreshCw, AlertCircle } from 'lucide-react';

export const AiAssistantDrawer: React.FC = () => {
  const { isOpen, setIsOpen, messages, addMessage } = useAiStore();
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: usage, isLoading: isUsageLoading, refetch: refetchUsage } = useAiUsageQuery();
  const chatMutation = useAiChatMutation();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [isOpen, messages, chatMutation.isPending]);

  
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      addMessage({
        role: 'assistant',
        content:
          'Hello! I am your Launchly AI Assistant. 🧠 I can help you design bot flows, explain how different nodes work, configure CRM settings, or set up Google Sheets integration. How can I help you today?',
      });
    }
  }, [isOpen, messages, addMessage]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text) return;

    if (chatMutation.isPending) return;

    
    if (usage && usage.requestsLimit > 0 && usage.requestsUsed >= usage.requestsLimit) {
      return;
    }

    setInputValue('');
    const userMsg = { role: 'user' as const, content: text };
    addMessage(userMsg);

    try {
      
      
      const historyToSend = messages
        .filter((_, idx) => idx > 0) 
        .map((m) => ({ role: m.role, content: m.content }));

      const response = await chatMutation.mutateAsync({
        message: text,
        history: historyToSend,
      });

      addMessage({
        role: 'assistant',
        content: response.reply,
      });
      refetchUsage();
    } catch (err) {
      addMessage({
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again or check your internet connection.',
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  const handleQuickQuestion = (question: string) => {
    handleSend(question);
  };

  if (!isOpen) return null;

  const isLimitReached =
    usage && usage.requestsLimit > 0 && usage.requestsUsed >= usage.requestsLimit;

  const quickQuestions = [
    'How do I add a new Telegram bot?',
    'What does the LEAD node do?',
    'How to sync orders with Google Sheets?',
    'Explain the condition block',
  ];

  return (
    <>
      
      <div
        className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-50 transition-opacity duration-300 animate-fadeIn"
        onClick={() => setIsOpen(false)}
      />

      
      <div className="fixed inset-y-0 right-0 w-full sm:w-[460px] bg-slate-50 border-l border-slate-200 shadow-2xl flex flex-col z-50 transition-transform duration-300 ease-out animate-slideIn">
        
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col gap-3 shrink-0">
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
                {quickQuestions.map((q) => (
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
        </div>

        
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
              className="absolute right-2 p-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white disabled:text-slate-400 rounded-lg transition-all cursor-pointer disabled:cursor-not-allowed"
            >
              <Send size={12} />
            </button>
          </div>
        </footer>
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
