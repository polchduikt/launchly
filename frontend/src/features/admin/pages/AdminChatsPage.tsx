import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '../layouts/AdminLayout';
import {
  Search,
  Filter,
  Send,
  Bot,
  Workflow,
  CheckCircle2,
  XCircle,
  Star,
  MessageSquare,
  Loader2,
  RotateCcw,
  Clock,
  Layers,
  Sparkles,
  Calendar,
  CalendarDays,
  CalendarRange,
  History,
  Infinity,
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  X,
  ChevronLeft,
  ChevronRight,
  Users,
  Key,
  UserCheck,
  Lock
} from 'lucide-react';
import { t } from '../../../i18n';
import {
  fetchAdminSupportTicketsApi,
  fetchAdminSupportTicketDetailApi,
  sendAdminSupportMessageApi,
  toggleAdminSupportTicketFavoriteApi,
  toggleAdminSupportTicketStatusApi,
  claimAdminSupportTicketApi,
  fetchAdminUserDetailsApi
} from '../api/adminApi';
import { useAuthStore } from '../../../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../constants/routes';

export const AdminChatsPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuthStore();

  useEffect(() => {
    if (currentUser && currentUser.role === 'ROLE_ADMIN') {
      navigate(ROUTES.ADMIN_STATS, { replace: true });
    }
  }, [currentUser, navigate]);

  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'favorites' | 'active' | 'completed' | 'resolved'>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<'all' | 'today' | 'yesterday' | 'week' | 'month'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isFilterCollapsed, setIsFilterCollapsed] = useState(false);
  const [isProfileCollapsed, setIsProfileCollapsed] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailPeriod, setDetailPeriod] = useState<'week' | 'month' | '3months' | 'all'>('all');
  const [activityCategoryFilter, setActivityCategoryFilter] = useState<'all' | 'automations' | 'broadcasts' | 'system'>('all');
  const [activityPage, setActivityPage] = useState(0);

  const { data: ticketsData, isLoading: isTicketsLoading } = useQuery({
    queryKey: ['adminSupportTickets', activeTab, selectedPeriod, searchQuery],
    queryFn: () => fetchAdminSupportTicketsApi(activeTab, selectedPeriod, searchQuery, 0, 50),
    refetchInterval: 5000,
  });

  const rawTickets = ticketsData?.content || [];

  const tickets = [...rawTickets]
    .filter(c => {
      if (activeTab === 'completed') {
        return c.status === 'CLOSED';
      }
      if (activeTab === 'resolved') {
        return c.status === 'RESOLVED';
      }
      return c.status !== 'RESOLVED' && c.status !== 'CLOSED';
    })
    .sort((a, b) => {
      const timeA = new Date(a.lastMessageTime || 0).getTime();
      const timeB = new Date(b.lastMessageTime || 0).getTime();
      return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
    });

  useEffect(() => {
    if (tickets.length > 0 && !selectedTicketId) {
      setSelectedTicketId(tickets[0].id);
    }
  }, [tickets, selectedTicketId]);

  const { data: selectedTicket } = useQuery({
    queryKey: ['adminSupportTicketDetail', selectedTicketId],
    queryFn: () => fetchAdminSupportTicketDetailApi(selectedTicketId!),
    enabled: !!selectedTicketId,
    refetchInterval: 3000,
  });

  const { data: userDetailData, isLoading: isDetailLoading } = useQuery({
    queryKey: ['adminUserDetails', selectedTicket?.userId, detailPeriod, activityCategoryFilter, activityPage],
    queryFn: () => fetchAdminUserDetailsApi(selectedTicket!.userId, detailPeriod, activityCategoryFilter, activityPage, 20),
    enabled: !!selectedTicket?.userId && showDetailModal
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedTicket?.messages]);

  const sendMessageMutation = useMutation({
    mutationFn: ({ id, text }: { id: number; text: string }) => sendAdminSupportMessageApi(id, text),
    onSuccess: () => {
      setReplyText('');
      queryClient.invalidateQueries({ queryKey: ['adminSupportTickets'] });
      queryClient.invalidateQueries({ queryKey: ['adminSupportTicketDetail', selectedTicketId] });
    },
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: (id: number) => toggleAdminSupportTicketFavoriteApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminSupportTickets'] });
      queryClient.invalidateQueries({ queryKey: ['adminSupportTicketDetail', selectedTicketId] });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status?: string }) => toggleAdminSupportTicketStatusApi(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminSupportTickets'] });
      queryClient.invalidateQueries({ queryKey: ['adminSupportTicketDetail', selectedTicketId] });
    },
  });

  const claimTicketMutation = useMutation({
    mutationFn: (id: number) => claimAdminSupportTicketApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminSupportTickets'] });
      queryClient.invalidateQueries({ queryKey: ['adminSupportTicketDetail', selectedTicketId] });
    },
  });

  const handleSelectTicket = (id: number) => {
    setSelectedTicketId(id);
  };

  const handleToggleFavorite = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavoriteMutation.mutate(id);
  };

  const handleCompleteDialog = () => {
    if (selectedTicketId) {
      toggleStatusMutation.mutate({ id: selectedTicketId, status: 'CLOSED' });
    }
  };

  const handleResolveDialog = () => {
    if (selectedTicketId) {
      toggleStatusMutation.mutate({ id: selectedTicketId, status: 'RESOLVED' });
    }
  };

  const handleResetFilters = () => {
    setActiveTab('all');
    setSelectedPeriod('all');
    setSearchQuery('');
    setSortOrder('desc');
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!replyText.trim() || !selectedTicketId) return;
    sendMessageMutation.mutate({ id: selectedTicketId, text: replyText.trim() });
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' + d.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit', hour12: false });
    } catch {
      return dateStr;
    }
  };

  const formatEuroDateTime = (dateStr?: string) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return `${day}.${month}.${year}, ${hours}:${minutes}:${seconds}`;
  };

  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return '';
    try {
      const d = new Date(timeStr);
      if (isNaN(d.getTime())) return timeStr;
      return d.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit', hour12: false });
    } catch {
      return timeStr;
    }
  };

  const getAuthProviderLabel = (provider?: string) => {
    if (!provider) return 'Email / Пароль';
    if (provider.toUpperCase() === 'GOOGLE') return 'Google OAuth';
    if (provider.toUpperCase() === 'TELEGRAM') return 'Telegram';
    return 'Email / Пароль';
  };

  const translateAuditTitle = (title: string) => {
    if (!title) return '';
    if (title.startsWith('Реєстрація у Launchly') || title.startsWith('Registered in Launchly')) {
      return t('audit.user_registration.title');
    }
    if (title.startsWith('Створено бота') || title.startsWith('Created bot')) {
      return t('audit.bot_created.title');
    }
    if (title.startsWith('Оновлено конфігурацію бота') || title.startsWith('Updated bot configuration')) {
      return t('audit.bot_updated.title');
    }
    if (title.startsWith('Створено автоворонку') || title.startsWith('Created flow schema')) {
      return t('audit.flow_schema_created.title');
    }
    if (title.startsWith('Запущено розсилку') || title.startsWith('Launched broadcast')) {
      return t('audit.broadcast_launched.title');
    }
    if (title.startsWith('Зміна ролі користувача') || title.startsWith('User role updated')) {
      return t('audit.user_role_updated.title');
    }
    if (title.startsWith('Блокування акаунту') || title.startsWith('Account blocked')) {
      return t('audit.user_blocked.title');
    }
    if (title.startsWith('Розблокування акаунту') || title.startsWith('Account unblocked')) {
      return t('audit.user_unblocked.title');
    }
    return title;
  };

  const translateAuditDescription = (desc: string) => {
    if (!desc) return '';
    if (desc.startsWith('Обліковий запис активовано через') || desc.startsWith('Account activated via')) {
      const parts = desc.split(/через|via/);
      const prov = parts[1]?.trim() || 'LOCAL';
      return t('audit.user_registration.desc', { provider: prov });
    }
    if (desc.startsWith('Успішна сесія авторизації в системі через Google OAuth') || desc.startsWith('Successful authentication session via Google OAuth')) {
      return t('audit.user_auth_oauth.desc');
    }
    if (desc.startsWith('Успішна сесія авторизації') || desc.startsWith('Successful authentication session')) {
      return t('audit.user_auth.desc');
    }
    if (desc.includes('Створено та активовано бота') || desc.includes('Created and activated bot') || desc.includes('Bot ID:')) {
      const match = desc.match(/Bot ID:\s*#?(\d+)/i);
      const botId = match ? match[1] : '';
      return t('audit.bot_connected.desc', { botId });
    }
    if (desc.includes('Оновлено структуру бот-схеми') || desc.includes('Updated flow schema')) {
      return t('audit.automation_modified.desc');
    }
    if (desc.includes('Створено розсилку') || desc.includes('Created broadcast')) {
      const nameMatch = desc.match(/['"](.*?)['"]/);
      const campaignName = nameMatch ? nameMatch[1] : '';
      return t('audit.broadcast_created.desc', { campaignName });
    }
    return desc;
  };

  return (
    <AdminLayout noPadding>
      <div className="flex h-full w-full overflow-hidden">
        
        {isFilterCollapsed ? (
          <aside
            onClick={() => setIsFilterCollapsed(false)}
            className="w-14 bg-white hover:bg-slate-100/80 border-r border-slate-200 h-full flex items-center justify-center shrink-0 font-sans cursor-pointer transition select-none z-20"
            title="Показати фільтри"
          >
            <PanelLeftOpen size={22} className="text-indigo-600" />
          </aside>
        ) : (
          <aside className="w-64 bg-white border-r border-slate-200 h-full flex flex-col shrink-0 font-sans z-20">
            <div className="h-16 px-4 border-b border-slate-200/60 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2 text-slate-800 font-extrabold text-xs tracking-wider uppercase">
                <Filter size={15} className="text-indigo-600" />
                <span>{t('admin.filters')}</span>
              </div>
              <div className="flex items-center space-x-1">
                {(activeTab !== 'all' || selectedPeriod !== 'all' || searchQuery.trim() || sortOrder !== 'desc') && (
                  <button
                    onClick={handleResetFilters}
                    className="p-1 text-slate-400 hover:text-indigo-600 transition cursor-pointer"
                    title={t('admin.reset_filters')}
                  >
                    <RotateCcw size={13} />
                  </button>
                )}
                <button
                  onClick={() => setIsFilterCollapsed(true)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
                  title="Сховати фільтри"
                >
                  <PanelLeftClose size={16} />
                </button>
              </div>
            </div>

            <div className="p-4 space-y-2.5 flex-1 overflow-y-auto custom-scrollbar">

            <div className="space-y-1 shrink-0">
              <label className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                {t('admin.search')}
              </label>
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                <input
                  type="text"
                  placeholder={t('admin.search_chats_placeholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none transition shadow-2xs"
                />
              </div>
            </div>

            <div className="space-y-1 shrink-0">
              <label className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                {t('admin.categories_label')}
              </label>
              <div className="space-y-0.5">
                {[
                  { id: 'all', label: t('admin.tab_all'), icon: Layers },
                  { id: 'unread', label: t('admin.tab_unread'), icon: Clock },
                  { id: 'favorites', label: t('admin.tab_favorites'), icon: Star },
                  { id: 'active', label: t('admin.tab_active'), icon: Sparkles },
                  { id: 'completed', label: t('admin.tab_completed'), icon: XCircle },
                  { id: 'resolved', label: t('admin.tab_resolved'), icon: CheckCircle2 }
                ].map(tab => {
                  const IconComponent = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-700 hover:bg-white hover:text-indigo-600'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <IconComponent size={14} className={isActive ? 'text-white' : 'text-slate-400'} />
                        <span>{tab.label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1 shrink-0">
              <label className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                {t('admin.period_label')}
              </label>
              <div className="space-y-0.5">
                {[
                  { id: 'all', label: t('admin.period_all'), icon: Infinity },
                  { id: 'today', label: t('admin.period_today'), icon: Calendar },
                  { id: 'yesterday', label: t('admin.period_yesterday'), icon: History },
                  { id: 'week', label: t('admin.period_week'), icon: CalendarDays },
                  { id: 'month', label: t('admin.period_month'), icon: CalendarRange }
                ].map(p => {
                  const IconComponent = p.icon;
                  const isActive = selectedPeriod === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPeriod(p.id as any)}
                      className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-700 hover:bg-white hover:text-indigo-600'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <IconComponent size={14} className={isActive ? 'text-white' : 'text-slate-400'} />
                        <span>{p.label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1 shrink-0">
              <label className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                {t('admin.sort_by')}
              </label>
              <div className="space-y-0.5">
                {[
                  { id: 'desc', label: t('admin.sort_newest'), icon: ArrowDownWideNarrow },
                  { id: 'asc', label: t('admin.sort_oldest'), icon: ArrowUpNarrowWide }
                ].map(s => {
                  const IconComponent = s.icon;
                  const isActive = sortOrder === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setSortOrder(s.id as any)}
                      className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-700 hover:bg-white hover:text-indigo-600'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <IconComponent size={14} className={isActive ? 'text-white' : 'text-slate-400'} />
                        <span>{s.label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
            </div>
          </aside>
        )}

        <aside className="w-80 lg:w-84 bg-white border-r border-slate-200 h-full flex flex-col shrink-0 z-10">
          <div className="h-16 px-4 border-b border-slate-100 flex items-center justify-between shrink-0">
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <MessageSquare size={16} className="text-indigo-600" />
              <span>{t('admin.chats_title')}</span>
            </h3>
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200/60 text-indigo-700 font-black text-[11px]">
              {tickets.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-slate-100">
            {isTicketsLoading ? (
              <div className="flex items-center justify-center py-16 text-slate-400 text-xs">
                <Loader2 size={16} className="animate-spin mr-2" />
                <span>{t('admin.loading_chats')}</span>
              </div>
            ) : tickets.length === 0 ? (
              <div className="text-center py-16 text-slate-400 text-xs font-medium px-4">
                {t('admin.no_chats_found')}
              </div>
            ) : (
              tickets.map(c => {
                const isSelected = c.id === selectedTicketId;
                return (
                  <div
                    key={c.id}
                    onClick={() => handleSelectTicket(c.id)}
                    className={`p-3.5 flex items-start gap-3 hover:bg-slate-50 transition cursor-pointer relative ${
                      isSelected ? 'bg-indigo-50/60' : ''
                    }`}
                  >
                    {isSelected && (
                      <span className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600 rounded-r-md" />
                    )}
                    <div className="relative shrink-0">
                      {c.userAvatar ? (
                        <img src={c.userAvatar} alt={c.userName} className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center font-extrabold text-indigo-700 text-xs">
                          {(c.userName || 'U')[0].toUpperCase()}
                        </div>
                      )}
                      {c.unread && (
                        <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-indigo-600 border-2 border-white" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className={`text-xs truncate ${c.unread ? 'font-black text-slate-900' : 'font-bold text-slate-800'}`}>
                          {c.userName}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 shrink-0 ml-1">
                          {formatTime(c.lastMessageTime)}
                        </span>
                      </div>

                      <p className={`text-[11px] truncate ${c.unread ? 'font-bold text-slate-900' : 'text-slate-500 font-medium'}`}>
                        {c.lastMessage || '...'}
                      </p>
                    </div>

                    <button
                      onClick={(e) => handleToggleFavorite(c.id, e)}
                      className={`p-1 rounded-lg transition hover:bg-slate-200 shrink-0 ${
                        c.isFavorite ? 'text-amber-500' : 'text-slate-300 hover:text-amber-400'
                      }`}
                    >
                      <Star size={14} fill={c.isFavorite ? 'currentColor' : 'none'} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {selectedTicket ? (
          <div className="flex-1 flex flex-col h-full bg-slate-50 min-w-0">
            
            <header className="h-16 px-6 bg-white border-b border-slate-200 flex items-center justify-between shrink-0 shadow-2xs">
              <div className="flex items-center space-x-3.5 min-w-0">
                {selectedTicket.userAvatar ? (
                  <img src={selectedTicket.userAvatar} alt={selectedTicket.userName} className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center font-extrabold text-indigo-700 text-sm shrink-0">
                    {(selectedTicket.userName || 'U')[0].toUpperCase()}
                  </div>
                )}

                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-bold text-slate-900 truncate">{selectedTicket.userName}</h3>
                    <span className="px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 font-extrabold text-[10px] uppercase font-mono">
                      {selectedTicket.userPlan}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 font-mono truncate">{selectedTicket.userEmail}</div>
                </div>
              </div>

            </header>

            <div className="flex-1 p-6 overflow-y-auto overflow-x-hidden custom-scrollbar space-y-4 min-w-0 select-text">
              {(selectedTicket.messages || []).map(msg => {
                if (msg.sender === 'SYSTEM') {
                  const managerName = msg.text.replace(/^До діалогу приєднався менеджер |^Manager /, '');
                  return (
                    <div key={msg.id} className="flex justify-center my-2">
                      <div className="px-3.5 py-1.5 rounded-full bg-slate-200/80 border border-slate-300 text-slate-700 text-[11px] font-bold shadow-2xs flex items-center gap-1.5">
                        <UserCheck size={13} className="text-indigo-600" />
                        <span>{t('admin.system_manager_joined', { name: managerName })}</span>
                      </div>
                    </div>
                  );
                }
                const isManagerMsg = msg.sender === 'MANAGER';
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col max-w-lg ${isManagerMsg ? 'items-end ml-auto' : 'items-start mr-auto'}`}
                  >
                    <div className="flex items-center space-x-2 mb-1 px-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {isManagerMsg ? t('admin.support_team') : msg.senderName}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">{formatTime(msg.timestamp)}</span>
                    </div>

                    <div
                      className={`p-3.5 rounded-2xl text-xs leading-relaxed shadow-2xs break-all [word-break:break-word] whitespace-pre-wrap ${
                        isManagerMsg
                          ? 'bg-indigo-600 text-white rounded-tr-xs font-medium'
                          : 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs font-medium'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-white border-t border-slate-200 space-y-3 shrink-0">
              {selectedTicket.status === 'RESOLVED' || selectedTicket.status === 'CLOSED' ? (
                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-2xl text-center space-y-1">
                  <div className="text-xs font-bold text-amber-900 flex items-center justify-center gap-1.5">
                    <CheckCircle2 size={15} className="text-amber-600" />
                    <span>{t('admin.dialog_closed_title')}</span>
                  </div>
                  <p className="text-[11px] text-amber-700 font-medium">
                    {t('admin.dialog_closed_desc')}
                  </p>
                </div>
              ) : !selectedTicket.assignedManagerEmail ? (
                <div className="p-4 bg-slate-50 border border-slate-200/90 rounded-2xl flex flex-col items-center justify-center space-y-2 text-center">
                  <div className="text-xs font-bold text-slate-700">
                    {t('admin.dialog_not_assigned_title')}
                  </div>
                  <button
                    type="button"
                    onClick={() => selectedTicketId && claimTicketMutation.mutate(selectedTicketId)}
                    disabled={claimTicketMutation.isPending}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-2xl transition flex items-center space-x-2 shadow-md shadow-indigo-100 cursor-pointer disabled:opacity-50"
                  >
                    {claimTicketMutation.isPending ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <UserCheck size={16} />
                    )}
                    <span>{t('admin.start_dialog_btn')}</span>
                  </button>
                </div>
              ) : selectedTicket.assignedManagerEmail !== currentUser?.email ? (
                <div className="p-3 bg-slate-100 border border-slate-300/80 rounded-2xl text-center space-y-1">
                  <div className="text-xs font-bold text-slate-800 flex items-center justify-center gap-1.5">
                    <Lock size={15} className="text-slate-600" />
                    <span>{t('admin.dialog_assigned_to_title', { name: selectedTicket.assignedManagerName || selectedTicket.assignedManagerEmail })}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {t('admin.dialog_assigned_to_desc')}
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between gap-3">
                  <div className="text-xs font-bold text-slate-700 flex items-center gap-2">
                    <Clock size={15} className="text-indigo-600" />
                    <span>{t('admin.dialog_actions_label')}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={handleCompleteDialog}
                      disabled={toggleStatusMutation.isPending}
                      className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <X size={14} />
                      <span>{t('admin.complete_dialog')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleResolveDialog}
                      disabled={toggleStatusMutation.isPending}
                      className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <CheckCircle2 size={14} />
                      <span>{t('admin.resolve_btn')}</span>
                    </button>
                  </div>
                </div>
              )}

              <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
                <input
                  type="text"
                  placeholder={
                    selectedTicket.status === 'RESOLVED' || selectedTicket.status === 'CLOSED'
                      ? t('admin.placeholder_dialog_closed')
                      : !selectedTicket.assignedManagerEmail
                      ? t('admin.placeholder_start_dialog')
                      : selectedTicket.assignedManagerEmail !== currentUser?.email
                      ? t('admin.placeholder_other_manager')
                      : t('admin.type_reply_placeholder')
                  }
                  value={replyText}
                  disabled={
                    selectedTicket.status === 'RESOLVED' ||
                    selectedTicket.status === 'CLOSED' ||
                    !selectedTicket.assignedManagerEmail ||
                    selectedTicket.assignedManagerEmail !== currentUser?.email
                  }
                  onChange={(e) => setReplyText(e.target.value)}
                  className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none transition shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  type="submit"
                  disabled={
                    !replyText.trim() ||
                    sendMessageMutation.isPending ||
                    selectedTicket.status === 'RESOLVED' ||
                    selectedTicket.status === 'CLOSED' ||
                    !selectedTicket.assignedManagerEmail ||
                    selectedTicket.assignedManagerEmail !== currentUser?.email
                  }
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-2xl disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center space-x-1.5 shadow-md shadow-indigo-100 cursor-pointer"
                >
                  {sendMessageMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  <span>{t('admin.send_btn')}</span>
                </button>
              </form>
            </div>

          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400 text-xs font-semibold">
            {t('admin.select_chat_hint')}
          </div>
        )}

        {selectedTicket && (
          isProfileCollapsed ? (
            <aside
              onClick={() => setIsProfileCollapsed(false)}
              className="w-14 bg-white hover:bg-slate-100/80 border-l border-slate-200 h-full flex items-center justify-center shrink-0 font-sans cursor-pointer transition select-none z-10"
              title="Показати інфо про клієнта"
            >
              <PanelRightOpen size={22} className="text-indigo-600" />
            </aside>
          ) : (
            <aside className="w-80 bg-white border-l border-slate-200 h-full flex flex-col shrink-0 z-10 font-sans select-text">
              <div className="h-16 px-5 border-b border-slate-100 flex items-center justify-between shrink-0">
                <h5 className="font-extrabold text-xs uppercase tracking-wider text-slate-800">
                  {t('admin.client_info')}
                </h5>
                <button
                  onClick={() => setIsProfileCollapsed(true)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                  title="Сховати інфо про клієнта"
                >
                  <PanelRightClose size={16} />
                </button>
              </div>

              <div className="p-5 space-y-5 overflow-y-auto flex-1 custom-scrollbar">

              <div className="text-center space-y-2 border-b border-slate-100 pb-4">
                {selectedTicket.userAvatar ? (
                  <img src={selectedTicket.userAvatar} alt={selectedTicket.userName} className="w-16 h-16 rounded-full object-cover border-2 border-indigo-100 mx-auto shadow-xs" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-indigo-100 border-2 border-indigo-200 flex items-center justify-center font-extrabold text-indigo-700 text-xl mx-auto shadow-xs">
                    {(selectedTicket.userName || 'U')[0].toUpperCase()}
                  </div>
                )}
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{selectedTicket.userName}</h4>
                  <p className="text-xs text-slate-500 font-mono truncate">{selectedTicket.userEmail}</p>
                </div>
                <div className="flex items-center justify-center gap-2 pt-1">
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-extrabold text-[10px] uppercase font-mono">
                    {selectedTicket.userPlan}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full border font-extrabold text-[10px] uppercase font-mono ${
                    selectedTicket.accountActive !== false
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}>
                    {selectedTicket.accountActive !== false ? t('admin.status_active_user') : t('admin.status_blocked_user')}
                  </span>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <h5 className="font-extrabold text-[10px] uppercase tracking-wider text-slate-400">
                  {t('admin.activity_and_stats')}
                </h5>
                
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-2.5 font-medium">
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-1.5"><Calendar size={13} className="text-slate-500" /> {t('admin.reg_date')}</span>
                    <span className="font-bold text-slate-900 font-mono text-[11px]">
                      {formatDate(selectedTicket.registeredAt)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-1.5"><Clock size={13} className="text-slate-500" /> {t('admin.last_activity')}</span>
                    <span className="font-bold text-slate-900 font-mono text-[11px]">
                      {formatDate(selectedTicket.lastActivityAt)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-1.5"><Key size={13} className="text-slate-500" /> {t('admin.auth_provider')}</span>
                    <span className="font-bold text-slate-900 font-mono text-[11px]">
                      {getAuthProviderLabel(selectedTicket.authProvider)}
                    </span>
                  </div>
                  {selectedTicket.telegramUserId && (
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="flex items-center gap-1.5"><Send size={13} className="text-sky-500" /> {t('admin.telegram_id')}</span>
                      <span className="font-bold text-slate-900 font-mono text-[11px]">
                        {selectedTicket.telegramUserId}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <h5 className="font-extrabold text-[10px] uppercase tracking-wider text-slate-400">
                  Ресурси користувача
                </h5>
                
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-2 font-medium">
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-1.5"><Bot size={13} className="text-indigo-600" /> {t('admin.bots_label')}</span>
                    <span className="font-bold text-slate-900 font-mono">{selectedTicket.botsCount}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-1.5"><Workflow size={13} className="text-purple-600" /> {t('admin.automations_label')}</span>
                    <span className="font-bold text-slate-900 font-mono">{selectedTicket.automationsCount}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-1.5"><Send size={13} className="text-blue-600" /> {t('admin.broadcasts_label')}</span>
                    <span className="font-bold text-slate-900 font-mono">{selectedTicket.broadcastsCount}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-1.5"><Users size={13} className="text-emerald-600" /> {t('admin.subscribers')}</span>
                    <span className="font-bold text-slate-900 font-mono">{selectedTicket.contactsCount ?? 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-1.5"><MessageSquare size={13} className="text-amber-600" /> {t('admin.messages_sent')}</span>
                    <span className="font-bold text-slate-900 font-mono">{selectedTicket.messagesCount ?? 0}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => {
                    setActivityPage(0);
                    setShowDetailModal(true);
                  }}
                  className="w-full py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center cursor-pointer shadow-xs"
                >
                  <span>{t('admin.more_details')}</span>
                </button>
              </div>
            </div>
          </aside>
        )
      )}

        {showDetailModal && selectedTicket && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 animate-in fade-in duration-150 font-sans">
            <div className="bg-white border border-slate-300 rounded-3xl w-full max-w-6xl h-[780px] max-h-[92vh] p-6 sm:p-7 shadow-2xl flex flex-col justify-between space-y-4 overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3.5 shrink-0">
                <div className="flex items-center space-x-3.5">
                  {selectedTicket.userAvatar ? (
                    <img
                      src={selectedTicket.userAvatar}
                      alt={selectedTicket.userName}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-300 flex items-center justify-center font-bold text-slate-700 text-lg">
                      {selectedTicket.userName ? selectedTicket.userName[0].toUpperCase() : 'U'}
                    </div>
                  )}

                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-base font-bold text-slate-900 leading-tight">{selectedTicket.userName}</h3>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 font-bold text-[10px] uppercase">
                        {selectedTicket.userRole || 'ROLE_OWNER'}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${
                        selectedTicket.accountActive !== false
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {selectedTicket.accountActive !== false ? t('admin.active') : t('admin.blocked')}
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 font-mono flex items-center space-x-2">
                      <span>{selectedTicket.userEmail}</span>
                      <span>ID: #{selectedTicket.userId}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="text-slate-400 hover:text-slate-700 p-1.5 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 shrink-0">
                <div className="flex items-center space-x-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase mr-1 flex items-center gap-1">
                    <Calendar size={13} />
                    {t('admin.period_label')}
                  </span>
                  {[
                    { id: 'week', label: t('admin.7_days') },
                    { id: 'month', label: t('admin.30_days') },
                    { id: '3months', label: t('admin.90_days') },
                    { id: 'all', label: t('admin.all_time') }
                  ].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setDetailPeriod(p.id as any);
                        setActivityPage(0);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                        detailPeriod === p.id
                          ? 'bg-slate-900 text-white'
                          : 'text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center space-x-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase mr-1 flex items-center gap-1">
                    <Filter size={13} />
                    {t('admin.category_label')}
                  </span>
                  {[
                    { id: 'all', label: t('admin.cat_all') },
                    { id: 'automations', label: t('admin.cat_automations') },
                    { id: 'broadcasts', label: t('admin.cat_broadcasts') },
                    { id: 'system', label: t('admin.cat_system') }
                  ].map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setActivityCategoryFilter(c.id as any);
                        setActivityPage(0);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                        activityCategoryFilter === c.id
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-6 gap-2 shrink-0">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5">
                  <div className="text-[10px] font-bold uppercase text-slate-500">{t('admin.active_bots')}</div>
                  <div className="text-base font-extrabold text-slate-900 mt-0.5">
                    {isDetailLoading ? '...' : (userDetailData?.botsCount ?? selectedTicket.botsCount)}
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5">
                  <div className="text-[10px] font-bold uppercase text-slate-500">{t('admin.cat_automations')}</div>
                  <div className="text-base font-extrabold text-slate-900 mt-0.5">
                    {isDetailLoading ? '...' : (userDetailData?.automationsCount ?? selectedTicket.automationsCount)}
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5">
                  <div className="text-[10px] font-bold uppercase text-slate-500">{t('admin.cat_broadcasts')}</div>
                  <div className="text-base font-extrabold text-slate-900 mt-0.5">
                    {isDetailLoading ? '...' : (userDetailData?.broadcastsCount ?? selectedTicket.broadcastsCount)}
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5">
                  <div className="text-[10px] font-bold uppercase text-slate-500">{t('admin.subscribers')}</div>
                  <div className="text-base font-extrabold text-slate-900 mt-0.5">
                    {isDetailLoading ? '...' : (userDetailData?.contactsCount ?? selectedTicket.contactsCount ?? 0)}
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5">
                  <div className="text-[10px] font-bold uppercase text-slate-500">{t('admin.messages_sent')}</div>
                  <div className="text-base font-extrabold text-slate-900 mt-0.5">
                    {isDetailLoading ? '...' : (userDetailData?.messagesCount ?? selectedTicket.messagesCount ?? 0)}
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5">
                  <div className="text-[10px] font-bold uppercase text-slate-500">{t('admin.subscription_plan')}</div>
                  <div className="text-xs font-bold text-slate-900 mt-1 truncate">
                    {selectedTicket.userPlan}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 flex-1 min-h-0 overflow-hidden">
                <div className="lg:col-span-5 flex flex-col space-y-3 min-h-0 h-full overflow-hidden">
                  
                  <div className="flex-1 flex flex-col min-h-0 border border-slate-200 rounded-2xl bg-slate-50/50 p-3 overflow-hidden">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200 text-xs font-bold text-slate-800 shrink-0">
                      <span>{t('admin.automations')}</span>
                      {userDetailData?.automations && (
                        <span className="text-[11px] font-mono text-slate-500 font-normal">
                          {t('admin.total')}: {userDetailData.automations.length}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pt-2 pr-1">
                      {isDetailLoading ? (
                        <div className="flex items-center justify-center py-6 text-slate-400 text-xs">
                          <Loader2 size={16} className="animate-spin mr-2" />
                          {t('admin.loading_history')}
                        </div>
                      ) : !userDetailData?.automations?.length ? (
                        <div className="text-center py-6 text-slate-400 text-xs font-medium">
                          {t('admin.no_records')}
                        </div>
                      ) : (
                        userDetailData.automations.map((auto) => (
                          <div
                            key={auto.id}
                            onClick={() => {
                              setShowDetailModal(false);
                              navigate(`${ROUTES.ADMIN_AUTOMATIONS}?search=${encodeURIComponent(auto.name)}`);
                            }}
                            className="bg-white border border-slate-200 rounded-xl p-2.5 hover:border-indigo-400 hover:shadow-xs cursor-pointer transition group flex flex-col justify-between"
                            title="Перейти до цієї автоматизації"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center space-x-2 min-w-0">
                                <span
                                  className={`w-2 h-2 rounded-full shrink-0 ${
                                    auto.active ? 'bg-emerald-500 shadow-xs shadow-emerald-500/50' : 'bg-slate-300'
                                  }`}
                                />
                                <span className="font-bold text-slate-800 text-xs truncate group-hover:text-indigo-600 transition">
                                  {auto.name}
                                </span>
                              </div>
                              <div className="flex items-center space-x-1 shrink-0">
                                <span className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-[9px] font-bold text-slate-600 uppercase font-mono">
                                  {auto.triggerType}
                                </span>
                                <ChevronRight size={14} className="text-slate-300 group-hover:text-indigo-600 transition" />
                              </div>
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono mt-1">
                              {auto.botName ? `Bot: ${auto.botName}` : `Updated: ${formatEuroDateTime(auto.updatedAt)}`}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col min-h-0 border border-slate-200 rounded-2xl bg-slate-50/50 p-3 overflow-hidden">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200 text-xs font-bold text-slate-800 shrink-0">
                      <span>{t('admin.broadcasts')}</span>
                      {userDetailData?.broadcasts && (
                        <span className="text-[11px] font-mono text-slate-500 font-normal">
                          {t('admin.total')}: {userDetailData.broadcasts.length}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pt-2 pr-1">
                      {isDetailLoading ? (
                        <div className="flex items-center justify-center py-6 text-slate-400 text-xs">
                          <Loader2 size={16} className="animate-spin mr-2" />
                          {t('admin.loading_history')}
                        </div>
                      ) : !userDetailData?.broadcasts?.length ? (
                        <div className="text-center py-6 text-slate-400 text-xs font-medium">
                          {t('admin.no_records')}
                        </div>
                      ) : (
                        userDetailData.broadcasts.map((b) => (
                          <div
                            key={b.id}
                            onClick={() => {
                              setShowDetailModal(false);
                              navigate(`${ROUTES.ADMIN_BROADCASTS}?search=${encodeURIComponent(b.name)}`);
                            }}
                            className="bg-white border border-slate-200 rounded-xl p-2.5 hover:border-indigo-400 hover:shadow-xs cursor-pointer transition group flex flex-col justify-between"
                            title="Перейти до цього бродкасту"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="font-bold text-slate-800 text-xs truncate group-hover:text-indigo-600 transition">
                                {b.name}
                              </span>
                              <div className="flex items-center space-x-1 shrink-0">
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase font-mono border ${
                                    b.status === 'COMPLETED'
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                      : b.status === 'RUNNING'
                                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                                      : 'bg-amber-50 text-amber-700 border-amber-200'
                                  }`}
                                >
                                  {b.status}
                                </span>
                                <ChevronRight size={14} className="text-slate-300 group-hover:text-indigo-600 transition" />
                              </div>
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono mt-1 flex justify-between">
                              <span>Sent: {b.sentCount ?? 0}</span>
                              <span>{formatEuroDateTime(b.createdAt)}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-7 border border-slate-200 rounded-2xl bg-slate-50/50 p-3.5 flex flex-col min-h-0 h-full overflow-hidden">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200 text-xs font-bold text-slate-800 shrink-0">
                    <span>{t('admin.activity_history')}</span>
                    {userDetailData?.activities && (
                      <span className="text-[11px] font-mono text-slate-500 font-normal">
                        {t('admin.total_records')} {userDetailData.activities.totalElements}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pt-2 pr-1">
                    {isDetailLoading ? (
                      <div className="flex items-center justify-center py-12 text-slate-400 text-xs">
                        <Loader2 size={16} className="animate-spin mr-2" />
                        {t('admin.loading_history')}
                      </div>
                    ) : userDetailData?.activities?.content && userDetailData.activities.content.length > 0 ? (
                      <div className="space-y-2">
                        {userDetailData.activities.content.map((act) => (
                          <div key={act.id} className="bg-white border border-slate-200 rounded-xl p-3 flex items-start justify-between text-xs hover:border-slate-300 transition shadow-2xs">
                            <div className="space-y-1 min-w-0 pr-2">
                              <div className="font-bold text-slate-900 flex items-center space-x-2 truncate">
                                <span className="truncate">{translateAuditTitle(act.title)}</span>
                                <span className="px-1.5 py-0.2 rounded bg-slate-100 border border-slate-200 text-slate-600 font-mono text-[9px] uppercase font-bold shrink-0">
                                  {act.badge}
                                </span>
                              </div>
                              <div className="text-slate-600 text-[11px] leading-relaxed">{translateAuditDescription(act.description)}</div>
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono shrink-0">
                              {formatEuroDateTime(act.timestamp)}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-slate-400 text-xs font-medium">
                        {t('admin.no_records')}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-200 shrink-0">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setActivityPage((prev) => Math.max(0, prev - 1))}
                    disabled={activityPage === 0 || isDetailLoading}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-bold hover:bg-slate-100 disabled:opacity-40 cursor-pointer flex items-center gap-1"
                  >
                    <ChevronLeft size={14} />
                    <span>{t('admin.prev_page')}</span>
                  </button>

                  <span className="text-xs text-slate-600 font-mono font-bold px-1">
                    {t('admin.page_x_of_y', { current: activityPage + 1, total: userDetailData?.activities?.totalPages || 1 })}
                  </span>

                  <button
                    onClick={() => setActivityPage((prev) => prev + 1)}
                    disabled={!userDetailData?.activities || activityPage + 1 >= userDetailData.activities.totalPages || isDetailLoading}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-bold hover:bg-slate-100 disabled:opacity-40 cursor-pointer flex items-center gap-1"
                  >
                    <span>{t('admin.next_page')}</span>
                    <ChevronRight size={14} />
                  </button>
                </div>

                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 cursor-pointer transition"
                >
                  {t('admin.close')}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
};

export default AdminChatsPage;
