import React, { useEffect, useRef, useState } from 'react';
import { useAiStore } from '../../../store/useAiStore';
import { useAuthStore } from '../../../store/useAuthStore';
import {
  useAiSessionsQuery,
  useAiSessionDetailsQuery,
  useCreateAiSessionMutation,
  useDeleteAiSessionMutation,
  useAiChatMutation,
  useAiUsageQuery,
} from '../../../hooks/ai/useAiQueries';
import { QUICK_QUESTIONS } from '../../../const/aiConfig';
import { t } from '../../../i18n/config';
import { DashboardLayout } from '../../../components/layout/DashboardLayout';
import { Send, Loader2, AlertCircle, Trash2, MessageSquare } from 'lucide-react';
import { AiIcon } from '../../../components/ui/AiIcon';
import { SafeAvatar } from '../../../components/common/SafeAvatar';
import type { AiChatSessionResponse } from '../../../types';

const AiPage: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const { setActiveTab, setOnGenerate, setIsOpen } = useAiStore();

  const { data: sessions = [], isLoading: isSessionsLoading } = useAiSessionsQuery();
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);

  const activeSessionId = selectedSessionId ?? (sessions.length > 0 ? sessions[0].id : null);
  const { data: activeSessionDetails } = useAiSessionDetailsQuery(activeSessionId);

  const createSessionMutation = useCreateAiSessionMutation();
  const deleteSessionMutation = useDeleteAiSessionMutation();
  const chatMutation = useAiChatMutation();
  const { data: usage, isLoading: isUsageLoading, refetch: refetchUsage } = useAiUsageQuery();

  const [inputValue, setInputValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];
  const messages = activeSessionDetails?.messages || [];

  const isLimitReached =
    Boolean(usage && (usage.tokensRemaining <= 0 || usage.remainingPercentage <= 0));

  const getSessionTitle = (session?: AiChatSessionResponse | null) => {
    return session?.title?.trim() || t('ai.new_chat', 'Новий чат');
  };

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chatMutation.isPending]);

  const handleCreateSession = async () => {
    try {
      const newSession = await createSessionMutation.mutateAsync({});
      setSelectedSessionId(newSession.id);
    } catch (e) {
      console.error('Failed to create session:', e);
    }
  };

  const handleDeleteSession = async (id: number) => {
    try {
      await deleteSessionMutation.mutateAsync(id);
      if (activeSessionId === id) {
        const remaining = sessions.filter((s) => s.id !== id);
        setSelectedSessionId(remaining.length > 0 ? remaining[0].id : null);
      }
    } catch (e) {
      console.error('Failed to delete session:', e);
    }
  };

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isLimitReached || chatMutation.isPending) return;

    setInputValue('');
    try {
      let targetSessionId = activeSessionId;
      if (!targetSessionId) {
        const created = await createSessionMutation.mutateAsync({});
        targetSessionId = created.id;
        setSelectedSessionId(created.id);
      }

      await chatMutation.mutateAsync({
        sessionId: targetSessionId,
        message: text,
      });
      refetchUsage();
    } catch (e) {
      console.error('Failed to send AI message:', e);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <DashboardLayout>
      <div className="h-full flex bg-[#F2EBDD] font-['Geist',sans-serif] overflow-hidden">

        {/* Left Sidebar (ChatGPT-style) */}
        <aside className="w-64 sm:w-72 md:w-80 shrink-0 bg-[#F2EBDD] border-r-2 border-[#0A0A0A] flex flex-col justify-between h-full font-['JetBrains_Mono',monospace] select-none z-10">
          
          {/* Top: LAUNCHLY AI title aligned with right header */}
          <div className="h-16 border-b-2 border-[#0A0A0A] px-6 flex items-center shrink-0">
            <h1 className="font-['Anybody',sans-serif] text-xl font-black text-[#0A0A0A] uppercase tracking-tight select-none">
              LAUNCHLY AI
            </h1>
          </div>

          {/* New Chat button before chat history */}
          <div className="p-3 pb-1 shrink-0">
            <button
              onClick={handleCreateSession}
              disabled={createSessionMutation.isPending}
              className="w-full bg-white hover:bg-[#0A0A0A] hover:text-[#F2EBDD] text-[#0A0A0A] border-2 border-[#0A0A0A] rounded-xl px-4 py-2.5 flex items-center justify-center text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-[2px_2px_0px_#0A0A0A] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 disabled:opacity-50"
            >
              <span>{t('ai.new_chat', 'Новий чат')}</span>
            </button>
          </div>

          {/* Middle: Chat History list */}
          <div className="flex-1 overflow-y-auto p-3 pt-2 space-y-1 custom-scrollbar">
            <div className="px-2 py-1.5 text-[10px] font-black text-[#0A0A0A]/60 uppercase tracking-widest">
              {t('ai.recent_chats', 'Історія чатів')}
            </div>
            
            {isSessionsLoading ? (
              <div className="px-2 py-6 flex justify-center">
                <Loader2 size={16} className="animate-spin text-[#0A0A0A]" />
              </div>
            ) : sessions.length === 0 ? (
              <div className="px-2 py-4 text-xs font-bold text-[#0A0A0A]/50 text-center">
                {t('ai.no_chats', 'Немає збережених чатів')}
              </div>
            ) : (
              sessions.map((s) => {
                const isActive = s.id === activeSessionId;
                return (
                  <div
                    key={s.id}
                    onClick={() => setSelectedSessionId(s.id)}
                    className={`group flex items-center justify-between px-3 py-2.5 rounded-xl border-2 transition-all cursor-pointer text-xs font-bold ${
                      isActive
                        ? 'bg-[#0A0A0A] text-[#F2EBDD] border-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A]'
                        : 'bg-white/60 hover:bg-white text-[#0A0A0A] border-transparent hover:border-[#0A0A0A]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-1">
                      <MessageSquare size={14} className="shrink-0 opacity-70" />
                      <span className="truncate">{getSessionTitle(s)}</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSession(s.id);
                      }}
                      className={`p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-500 hover:text-white shrink-0 ${
                        isActive ? 'text-[#F2EBDD]' : 'text-[#0A0A0A]'
                      }`}
                      title={t('common.delete', 'Видалити')}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Bottom: Tokens Usage Section (Full square, seamlessly integrated) */}
          <div className="h-[190px] p-4 sm:p-5 border-t-2 border-[#0A0A0A] bg-[#F2EBDD] flex flex-col justify-between shrink-0">
            <div className="flex items-center justify-between">
              <span className="font-['Anybody',sans-serif] text-xs font-black text-[#0A0A0A] uppercase tracking-tight">
                {t('ai.tokens_used', 'Використання токенів')}
              </span>
              {isUsageLoading && <Loader2 size={13} className="animate-spin text-[#0A0A0A]" />}
            </div>

            <div className="flex items-center gap-4 my-auto">
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 shrink-0 flex items-center justify-center">
                <svg className="w-16 h-16 sm:w-20 sm:h-20 transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-[#0A0A0A]/10"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-[#0A0A0A] transition-all duration-700 ease-out"
                    strokeDasharray={`${Math.max(0, Math.min(100, usage?.remainingPercentage ?? 0))}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="text-xs sm:text-sm font-black font-mono text-[#0A0A0A]">
                    {usage ? `${usage.remainingPercentage}%` : '—'}
                  </span>
                </div>
              </div>

              <div className="flex-1 min-w-0 space-y-1">
                <div className="text-xs sm:text-sm font-black text-[#0A0A0A] font-mono leading-tight truncate">
                  {usage ? `${usage.tokensUsed?.toLocaleString() ?? 0} / ${usage.tokenLimit?.toLocaleString() ?? 0}` : '0 / 0'}
                </div>
                <div className="text-[10px] sm:text-xs font-black text-[#0A0A0A]/70 uppercase tracking-wide">
                  {t('ai.tokens', 'токенів')}
                </div>
                <div className="text-[9px] sm:text-[10px] font-bold text-[#0A0A0A]/50 leading-tight">
                  {t('ai.resets_daily', 'Оновлюється щодня о 00:00')}
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0 bg-[#F2EBDD]">
          
          {/* Top Header - Aligned in height and border with the sidebar */}
          <header className="h-16 border-b-2 border-[#0A0A0A] px-6 flex items-center justify-between shrink-0 z-10 font-['JetBrains_Mono',monospace]">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase text-[#0A0A0A] tracking-wider truncate max-w-md">
                {getSessionTitle(currentSession)}
              </span>
            </div>
          </header>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-5 flex flex-col font-['JetBrains_Mono',monospace]">
            {messages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-6 max-w-2xl mx-auto">
                <div className="space-y-2 select-none">
                  <h2 className="font-['Anybody',sans-serif] text-2xl font-black text-[#0A0A0A] uppercase tracking-tight">
                    LAUNCHLY AI
                  </h2>
                  <p className="text-xs font-bold text-[#0A0A0A]/70 max-w-md mx-auto">
                    {t('ai.drawer.chat_placeholder', 'Запитайте щось у Launchly AI...')}
                  </p>
                </div>

                <div className="w-full space-y-3 select-none">
                  <p className="text-[10px] font-black text-[#0A0A0A]/60 uppercase tracking-widest text-center">
                    {t('ai.drawer.suggested_questions', 'Рекомендовані запитання')}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full">
                    {QUICK_QUESTIONS.map((q) => (
                      <button
                        key={q}
                        onClick={() => handleSend(t(q))}
                        className="p-3 bg-white hover:bg-[#0A0A0A] hover:text-[#F2EBDD] border-2 border-[#0A0A0A] rounded-xl text-xs font-bold text-[#0A0A0A] transition-all cursor-pointer shadow-[2px_2px_0px_#0A0A0A] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 text-left"
                      >
                        {t(q)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
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
                        {isUser ? (
                          <SafeAvatar
                            src={user?.avatar}
                            name={user?.name}
                            className="w-9 h-9 rounded-xl object-cover border-2 border-[#0A0A0A] shrink-0"
                            fallbackClassName="w-9 h-9 rounded-xl bg-white text-[#0A0A0A] font-bold text-xs flex items-center justify-center border-2 border-[#0A0A0A] shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-xl bg-white border-2 border-[#0A0A0A] text-[#0A0A0A] flex items-center justify-center shrink-0">
                            <AiIcon size={16} />
                          </div>
                        )}

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
                        <AiIcon size={16} />
                      </div>
                      <div className="p-4 rounded-2xl bg-white text-[#0A0A0A] border-2 border-[#0A0A0A] rounded-tl-none flex items-center gap-2">
                        <Loader2 size={14} className="animate-spin text-[#0A0A0A]" />
                        <span className="text-[11px] font-extrabold uppercase">{t('ai.drawer.composing')}</span>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>
              </div>
            )}
          </div>

          {/* Footer / Prompt Input */}
          <footer className="bg-transparent px-4 sm:px-6 pb-6 pt-2 shrink-0 relative font-['JetBrains_Mono',monospace]">
            <div className="max-w-4xl mx-auto space-y-2.5">
              {isLimitReached && (
                <div className="flex items-start gap-2 text-rose-800 bg-rose-200 border-2 border-[#0A0A0A] p-2.5 rounded-xl">
                  <AlertCircle size={15} className="shrink-0 mt-0.5" />
                  <span className="text-[10px] font-black uppercase">
                    {t('ai.drawer.usage.limit_reached')}
                  </span>
                </div>
              )}

              <div className="flex items-end bg-white border-2 border-[#0A0A0A] rounded-2xl transition-all p-2 w-full gap-2 shadow-[2px_2px_0px_#0A0A0A]">
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
      </div>
    </DashboardLayout>
  );
};

export default AiPage;
