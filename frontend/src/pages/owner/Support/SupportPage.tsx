import React, { useState, useEffect, useRef } from 'react';
import { DashboardLayout } from '../../../components/layout/DashboardLayout';
import {
  useUserTicketsQuery,
  useUserTicketDetailQuery,
  useCreateTicketMutation,
  useSendTicketMessageMutation,
  useUpdateTicketStatusMutation,
} from '../../../hooks/support/useSupportQueries';
import { useAuthStore } from '../../../store/useAuthStore';
import { useTranslation, getLanguage } from '../../../i18n/config';
import type { SupportMessageItem } from '../../../api/support';
import {
  HelpCircle,
  Plus,
  Search,
  Send,
  Loader2,
  Clock,
  UserCheck,
  ShieldCheck,
  CheckCircle2,
  Lock,
  MessageSquare,
  AlertCircle,
  X,
  Headphones,
} from 'lucide-react';

export const SupportPage: React.FC = () => {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);

  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<'active' | 'resolved'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [replyText, setReplyText] = useState('');
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [newError, setNewError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: ticketsData, isLoading: isTicketsLoading } = useUserTicketsQuery();
  const { data: currentTicket, isLoading: isDetailLoading } = useUserTicketDetailQuery(selectedTicketId);

  const createTicketMut = useCreateTicketMutation();
  const sendMessageMut = useSendTicketMessageMutation(selectedTicketId);
  const updateStatusMut = useUpdateTicketStatusMutation(selectedTicketId);

  const tickets = ticketsData?.content || [];

  const filteredTickets = tickets.filter((ticket) => {
    if (filterStatus === 'active' && ticket.status !== 'ACTIVE') return false;
    if (filterStatus === 'resolved' && ticket.status === 'ACTIVE') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchSubject = ticket.subject?.toLowerCase().includes(q);
      const matchLastMsg = ticket.lastMessage?.toLowerCase().includes(q);
      const matchManager = ticket.assignedManagerName?.toLowerCase().includes(q);
      if (!matchSubject && !matchLastMsg && !matchManager) return false;
    }
    return true;
  });

  useEffect(() => {
    if (filteredTickets.length > 0) {
      const exists = filteredTickets.some((t) => t.id === selectedTicketId);
      if (!exists) {
        setSelectedTicketId(filteredTickets[0].id);
      }
    } else {
      setSelectedTicketId(null);
    }
  }, [filterStatus, ticketsData]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentTicket?.messages]);

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!replyText.trim() || !selectedTicketId || sendMessageMut.isPending) return;

    sendMessageMut.mutate(replyText.trim(), {
      onSuccess: () => {
        setReplyText('');
      },
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCreateTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim()) {
      setNewError('Subject is required');
      return;
    }
    if (!newMessage.trim()) {
      setNewError('Message is required');
      return;
    }
    setNewError(null);

    createTicketMut.mutate(
      { subject: newSubject.trim(), message: newMessage.trim() },
      {
        onSuccess: (created) => {
          setIsNewModalOpen(false);
          setNewSubject('');
          setNewMessage('');
          setFilterStatus('active');
          setSelectedTicketId(created.id);
        },
        onError: (err: any) => {
          setNewError(err?.response?.data?.message || 'Failed to create support ticket');
        },
      }
    );
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const lang = getLanguage();
      return d.toLocaleDateString(lang === 'uk' ? 'uk-UA' : 'en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const formatSystemMessage = (msg: SupportMessageItem) => {
    let text = msg.text || '';
    let name = currentTicket?.assignedManagerName || '';
    if (!name) {
      const cleaned = text
        .replace(/^До діалогу приєднався менеджер\s*/i, '')
        .replace(/^Manager\s*/i, '')
        .replace(/\s*joined the dialog$/i, '')
        .replace(/\{0\}/g, '')
        .trim();
      if (cleaned) name = cleaned;
    }
    if (!name) name = t('support.system_support_name', 'Служба підтримки');
    return t('support.system_manager_joined', { name });
  };

  const quickCategories = [
    { label: t('support.quick_category_tech', 'Технічна підтримка'), value: 'Технічна підтримка' },
    { label: t('support.quick_category_billing', 'Оплата та тарифи'), value: 'Оплата та тарифи' },
    { label: t('support.quick_category_bots', 'Telegram боти'), value: 'Telegram боти' },
    { label: t('support.quick_category_other', 'Інше'), value: 'Загальне питання' },
  ];

  const isResolvedOrClosed = currentTicket?.status === 'RESOLVED' || currentTicket?.status === 'CLOSED';

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full bg-[#F2EBDD] font-['JetBrains_Mono',monospace] overflow-hidden">
        <header className="px-6 py-4 border-b-2 border-[#0A0A0A] bg-white flex flex-wrap items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#0A0A0A] text-[#F2EBDD] flex items-center justify-center border-2 border-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A]">
              <Headphones size={20} />
            </div>
            <div>
              <h1 className="font-['Anybody',sans-serif] text-lg md:text-xl font-black text-[#0A0A0A] uppercase tracking-tight leading-none">
                {t('support.page_title', 'СЛУЖБА ПІДТРИМКИ')}
              </h1>
              <p className="text-xs text-slate-500 font-bold mt-1 hidden sm:block">
                {t('support.page_subtitle', "Прямий зв'язок із менеджерами Launchly для вирішення питань")}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setNewError(null);
              setIsNewModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#0A0A0A] text-[#F2EBDD] border-2 border-[#0A0A0A] rounded-xl text-xs font-black uppercase shadow-[3px_3px_0px_#0A0A0A] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer"
          >
            <Plus size={15} />
            <span>{t('support.btn_new_ticket', 'Нове звернення')}</span>
          </button>
        </header>

        <div className="flex-1 flex overflow-hidden">
          <aside className="w-full md:w-80 lg:w-96 border-r-2 border-[#0A0A0A] bg-[#F2EBDD] flex flex-col shrink-0 overflow-hidden">
            <div className="p-3.5 border-b-2 border-[#0A0A0A] bg-white space-y-2.5 shrink-0">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder={t('support.search_placeholder', 'Пошук звернень...')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border-2 border-[#0A0A0A] rounded-xl text-xs font-bold text-[#0A0A0A] focus:outline-none placeholder:text-slate-400"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setFilterStatus('active')}
                  className={`flex-1 py-1.5 text-xs font-black uppercase rounded-xl border-2 transition-all cursor-pointer shadow-[2px_2px_0px_#0A0A0A] ${
                    filterStatus === 'active'
                      ? 'bg-[#0A0A0A] text-[#F2EBDD] border-[#0A0A0A]'
                      : 'bg-white text-[#0A0A0A] border-[#0A0A0A] hover:bg-slate-100'
                  }`}
                >
                  {t('support.filter_active', 'Активні')}
                </button>
                <button
                  onClick={() => setFilterStatus('resolved')}
                  className={`flex-1 py-1.5 text-xs font-black uppercase rounded-xl border-2 transition-all cursor-pointer shadow-[2px_2px_0px_#0A0A0A] ${
                    filterStatus === 'resolved'
                      ? 'bg-[#0A0A0A] text-[#F2EBDD] border-[#0A0A0A]'
                      : 'bg-white text-[#0A0A0A] border-[#0A0A0A] hover:bg-slate-100'
                  }`}
                >
                  {t('support.filter_resolved', 'Вирішені')}
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2.5 space-y-2 custom-scrollbar">
              {isTicketsLoading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-500">
                  <Loader2 className="animate-spin text-[#0A0A0A]" size={24} />
                  <span className="text-xs font-bold">{t('common.loading', 'Завантаження...')}</span>
                </div>
              ) : filteredTickets.length === 0 ? (
                <div className="p-6 text-center space-y-3 bg-white border-2 border-[#0A0A0A] rounded-2xl">
                  <HelpCircle className="mx-auto text-slate-400" size={32} />
                  <p className="text-xs font-black text-[#0A0A0A] uppercase">
                    {filterStatus === 'active'
                      ? t('support.empty_tickets_title', 'У вас ще немає активних звернень')
                      : 'Немає вирішених звернень'}
                  </p>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    {t('support.empty_tickets_desc', 'Створіть звернення, і менеджер відповість вам.')}
                  </p>
                  {filterStatus === 'active' && (
                    <button
                      onClick={() => setIsNewModalOpen(true)}
                      className="px-3 py-1.5 bg-[#0A0A0A] text-[#F2EBDD] border-2 border-[#0A0A0A] rounded-xl text-[10px] font-black uppercase cursor-pointer"
                    >
                      {t('support.btn_new_ticket', 'Нове звернення')}
                    </button>
                  )}
                </div>
              ) : (
                filteredTickets.map((ticket) => {
                  const isSelected = ticket.id === selectedTicketId;
                  const isClosed = ticket.status === 'CLOSED';
                  const isResolved = ticket.status === 'RESOLVED';

                  return (
                    <div
                      key={ticket.id}
                      onClick={() => setSelectedTicketId(ticket.id)}
                      className={`p-3 rounded-2xl border-2 transition-all cursor-pointer flex flex-col gap-1.5 ${
                        isSelected
                          ? 'bg-white border-[#0A0A0A] shadow-[3px_3px_0px_#0A0A0A] -translate-y-0.5'
                          : 'bg-[#FAF8F5] border-[#0A0A0A] hover:bg-white hover:shadow-[2px_2px_0px_#0A0A0A]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-['Anybody',sans-serif] text-xs font-black text-[#0A0A0A] uppercase truncate flex-1">
                          {ticket.subject || t('support.page_title', 'Звернення')}
                        </span>
                        <span
                          className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border shrink-0 ${
                            isClosed
                              ? 'bg-slate-200 border-slate-400 text-slate-700'
                              : isResolved
                              ? 'bg-emerald-100 border-emerald-500 text-emerald-800'
                              : 'bg-amber-200 border-amber-500 text-amber-900 animate-pulse'
                          }`}
                        >
                          {isClosed
                            ? t('support.status_closed', 'Закрито')
                            : isResolved
                            ? t('support.status_resolved', 'Вирішено')
                            : t('support.status_active', 'В обробці')}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-600 font-bold line-clamp-2 leading-relaxed">
                        {ticket.lastMessage || '—'}
                      </p>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-[#0A0A0A]/10 mt-1">
                        <span className="flex items-center gap-1 font-semibold truncate max-w-[140px]">
                          {ticket.assignedManagerName ? (
                            <>
                              <UserCheck size={11} className="text-emerald-600 shrink-0" />
                              <span className="truncate">{ticket.assignedManagerName}</span>
                            </>
                          ) : (
                            <>
                              <Clock size={11} className="text-amber-500 shrink-0" />
                              <span>{t('support.manager_pending', 'Очікує менеджера')}</span>
                            </>
                          )}
                        </span>
                        <span>{formatDate(ticket.lastMessageTime)}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </aside>

          <main className="flex-1 flex flex-col bg-white overflow-hidden">
            {selectedTicketId && currentTicket ? (
              <>
                <div className="px-6 py-3.5 border-b-2 border-[#0A0A0A] bg-[#FAF8F5] flex flex-wrap items-center justify-between gap-3 shrink-0">
                  <div className="space-y-0.5">
                    <h2 className="font-['Anybody',sans-serif] text-sm md:text-base font-black text-[#0A0A0A] uppercase tracking-tight">
                      {currentTicket.subject}
                    </h2>
                    <div className="flex items-center gap-3 text-xs text-slate-500 font-bold">
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {formatDate(currentTicket.registeredAt)}
                      </span>
                      {currentTicket.assignedManagerName && (
                        <span className="flex items-center gap-1 text-emerald-700">
                          <ShieldCheck size={12} />
                          {t('support.manager_assigned', { name: currentTicket.assignedManagerName })}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-black uppercase px-3 py-1 rounded-xl border-2 ${
                        currentTicket.status === 'CLOSED'
                          ? 'bg-slate-200 border-slate-400 text-slate-700'
                          : currentTicket.status === 'RESOLVED'
                          ? 'bg-emerald-100 border-emerald-500 text-emerald-800'
                          : 'bg-amber-200 border-amber-500 text-amber-900'
                      }`}
                    >
                      {currentTicket.status === 'CLOSED'
                        ? t('support.status_closed', 'Закрито')
                        : currentTicket.status === 'RESOLVED'
                        ? t('support.status_resolved', 'Вирішено')
                        : t('support.status_active', 'В обробці')}
                    </span>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-slate-50/50 custom-scrollbar">
                  {isDetailLoading ? (
                    <div className="h-full flex items-center justify-center">
                      <Loader2 className="animate-spin text-[#0A0A0A]" size={32} />
                    </div>
                  ) : (
                    (currentTicket.messages || []).map((msg: SupportMessageItem) => {
                      const isUser = msg.sender === 'USER';
                      const isSystem = msg.sender === 'SYSTEM';

                      if (isSystem) {
                        return (
                          <div key={msg.id} className="flex justify-center my-2">
                            <div className="px-4 py-1.5 rounded-xl bg-amber-200 border-2 border-[#0A0A0A] text-[#0A0A0A] text-[11px] font-black uppercase shadow-[2px_2px_0px_#0A0A0A] flex items-center gap-1.5">
                              <UserCheck size={13} className="text-[#0A0A0A]" />
                              <span>{formatSystemMessage(msg)}</span>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={msg.id}
                          className={`flex gap-3 max-w-2xl ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                        >
                          <div
                            className={`w-8 h-8 rounded-full border-2 border-[#0A0A0A] flex items-center justify-center shrink-0 font-bold text-xs ${
                              isUser
                                ? 'bg-[#0A0A0A] text-[#F2EBDD]'
                                : 'bg-emerald-500 text-white'
                            }`}
                          >
                            {isUser ? (user?.name?.charAt(0) || 'U') : <Headphones size={14} />}
                          </div>

                          <div className="space-y-1 max-w-[85%]">
                            <div
                              className={`flex items-center gap-2 text-[10px] font-bold text-slate-400 ${
                                isUser ? 'justify-end' : 'justify-start'
                              }`}
                            >
                              <span>{isUser ? (user?.name || 'Ви') : (msg.senderName || t('support.system_support_name', 'Служба підтримки'))}</span>
                              <span>•</span>
                              <span>{formatDate(msg.timestamp)}</span>
                            </div>

                            <div
                              className={`p-3.5 rounded-2xl border-2 border-[#0A0A0A] text-xs font-bold leading-relaxed break-words whitespace-pre-wrap ${
                                isUser
                                  ? 'bg-[#F2EBDD] text-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A] rounded-tr-none'
                                  : 'bg-white text-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A] rounded-tl-none'
                              }`}
                            >
                              {msg.text}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="p-4 border-t-2 border-[#0A0A0A] bg-white shrink-0 space-y-3">
                  {isResolvedOrClosed ? (
                    <div className="p-3.5 bg-slate-100 border-2 border-[#0A0A0A] rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left shadow-[2px_2px_0px_#0A0A0A]">
                      <div className="flex items-center gap-2.5 text-xs font-bold text-slate-700">
                        {currentTicket.status === 'CLOSED' ? (
                          <Lock size={16} className="text-slate-600 shrink-0" />
                        ) : (
                          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                        )}
                        <span>
                          {currentTicket.status === 'CLOSED'
                            ? t('support.dialog_closed_notice', 'Це звернення закрито. Щоб надіслати нове повідомлення, створіть нове звернення.')
                            : t('support.ticket_resolved_notice', 'Діалог вирішено. Створіть нове звернення, якщо потрібна допомога.')}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setNewSubject(`Follow-up: ${currentTicket.subject}`);
                          setIsNewModalOpen(true);
                        }}
                        className="px-4 py-2 bg-[#0A0A0A] text-[#F2EBDD] border-2 border-[#0A0A0A] rounded-xl text-xs font-black uppercase cursor-pointer shrink-0 shadow-[2px_2px_0px_#0A0A0A]"
                      >
                        {t('support.btn_new_ticket', 'Нове звернення')}
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="p-2.5 bg-[#FAF8F5] border-2 border-[#0A0A0A] rounded-2xl flex items-center justify-between gap-3 shadow-[2px_2px_0px_#0A0A0A]">
                        <div className="text-xs font-black uppercase text-[#0A0A0A] flex items-center gap-2">
                          <CheckCircle2 size={15} className="text-[#0A0A0A]" />
                          <span>{t('support.actions_label', 'Дії з діалогом:')}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => updateStatusMut.mutate('RESOLVED')}
                          disabled={updateStatusMut.isPending}
                          className="px-3.5 py-1.5 bg-emerald-200 hover:bg-emerald-300 text-emerald-950 border-2 border-[#0A0A0A] rounded-xl text-xs font-black uppercase transition flex items-center space-x-1.5 cursor-pointer shadow-[2px_2px_0px_#0A0A0A] disabled:opacity-50"
                        >
                          {updateStatusMut.isPending ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : (
                            <CheckCircle2 size={13} />
                          )}
                          <span>{t('support.resolve_btn', 'Вирішено')}</span>
                        </button>
                      </div>

                      <form onSubmit={handleSendMessage} className="flex gap-2">
                        <textarea
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          onKeyDown={handleKeyDown}
                          rows={2}
                          placeholder={t('support.type_message_placeholder', 'Напишіть повідомлення менеджеру... (Enter для відправки)')}
                          className="flex-1 p-3 bg-slate-50 border-2 border-[#0A0A0A] rounded-2xl text-xs font-bold text-[#0A0A0A] focus:outline-none resize-none placeholder:text-slate-400"
                        />
                        <button
                          type="submit"
                          disabled={!replyText.trim() || sendMessageMut.isPending}
                          className="px-5 bg-[#0A0A0A] text-[#F2EBDD] border-2 border-[#0A0A0A] rounded-2xl font-black text-xs uppercase flex items-center justify-center gap-2 hover:bg-[#2A2A2A] disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer shadow-[3px_3px_0px_#0A0A0A]"
                        >
                          {sendMessageMut.isPending ? (
                            <Loader2 className="animate-spin" size={16} />
                          ) : (
                            <>
                              <Send size={15} />
                              <span className="hidden sm:inline">{t('support.send_btn', 'Надіслати')}</span>
                            </>
                          )}
                        </button>
                      </form>
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-6 text-center space-y-3 bg-[#FAF8F5]">
                <div className="w-14 h-14 rounded-full bg-white border-2 border-[#0A0A0A] flex items-center justify-center shadow-[3px_3px_0px_#0A0A0A]">
                  <MessageSquare size={26} className="text-[#0A0A0A]" />
                </div>
                <h3 className="font-['Anybody',sans-serif] text-base font-black text-[#0A0A0A] uppercase">
                  {t('support.select_ticket_title', 'Оберіть звернення зі списку ліворуч')}
                </h3>
                <p className="text-xs text-slate-500 font-bold max-w-sm leading-relaxed">
                  {t('support.select_ticket_desc', 'Тут відображатиметься листування з менеджером підтримки')}
                </p>
                <button
                  onClick={() => setIsNewModalOpen(true)}
                  className="px-4 py-2 bg-[#0A0A0A] text-[#F2EBDD] border-2 border-[#0A0A0A] rounded-xl text-xs font-black uppercase shadow-[3px_3px_0px_#0A0A0A] cursor-pointer"
                >
                  {t('support.btn_new_ticket', 'Нове звернення')}
                </button>
              </div>
            )}
          </main>
        </div>
      </div>

      {isNewModalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsNewModalOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0A0A0A]/50 animate-fade-in font-['JetBrains_Mono',monospace] cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#F2EBDD] rounded-3xl border-2 border-[#0A0A0A] shadow-[8px_8px_0px_#0A0A0A] w-full max-w-lg overflow-hidden flex flex-col animate-zoom-in cursor-default"
          >
            <div className="px-6 py-4 border-b-2 border-[#0A0A0A] bg-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <Headphones size={18} className="text-[#0A0A0A]" />
                <h3 className="font-['Anybody',sans-serif] text-sm md:text-base font-black text-[#0A0A0A] uppercase tracking-tight">
                  {t('support.new_modal_title', 'Нове звернення до підтримки')}
                </h3>
              </div>
              <button
                onClick={() => setIsNewModalOpen(false)}
                className="w-7 h-7 rounded-xl border-2 border-[#0A0A0A] bg-white flex items-center justify-center text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-[#F2EBDD] transition-colors cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handleCreateTicketSubmit} className="p-6 space-y-4">
              {newError && (
                <div className="p-3 bg-rose-100 border-2 border-rose-600 rounded-xl text-xs font-bold text-rose-800 flex items-center gap-2">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{newError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase text-[#0A0A0A] block">
                  {t('support.subject_label', 'Тема звернення')}
                </label>
                <div className="flex flex-wrap gap-1.5 pb-1">
                  {quickCategories.map((cat) => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setNewSubject(cat.value)}
                      className="px-2 py-0.5 bg-white border border-[#0A0A0A] rounded-lg text-[10px] font-bold text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-[#F2EBDD] transition-colors cursor-pointer"
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder={t('support.subject_placeholder', 'напр. Питання щодо налаштування бота')}
                  className="w-full px-3.5 py-2 bg-white border-2 border-[#0A0A0A] rounded-xl text-xs font-bold text-[#0A0A0A] focus:outline-none placeholder:text-slate-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase text-[#0A0A0A] block">
                  {t('support.message_label', 'Опишіть ваше запитання або проблему')}
                </label>
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  rows={5}
                  placeholder={t('support.message_placeholder', 'Детально опишіть ситуацію, додайте деталі тощо...')}
                  className="w-full p-3.5 bg-white border-2 border-[#0A0A0A] rounded-xl text-xs font-bold text-[#0A0A0A] focus:outline-none resize-none placeholder:text-slate-400"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 bg-white border-2 border-[#0A0A0A] rounded-xl text-xs font-black uppercase text-[#0A0A0A] hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  {t('support.cancel_btn', 'Скасувати')}
                </button>
                <button
                  type="submit"
                  disabled={createTicketMut.isPending || !newSubject.trim() || !newMessage.trim()}
                  className="px-5 py-2 bg-[#0A0A0A] text-[#F2EBDD] border-2 border-[#0A0A0A] rounded-xl text-xs font-black uppercase flex items-center gap-2 hover:bg-[#2A2A2A] disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer shadow-[3px_3px_0px_#0A0A0A]"
                >
                  {createTicketMut.isPending ? (
                    <Loader2 className="animate-spin" size={14} />
                  ) : (
                    <Send size={14} />
                  )}
                  <span>{t('support.create_btn', 'Надіслати звернення')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};
