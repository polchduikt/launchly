import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '../../../components/layout/AdminLayout';
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
  Infinity as InfinityIcon,
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
import {
  fetchAdminSupportTicketsApi,
  fetchAdminSupportTicketDetailApi,
  sendAdminSupportMessageApi,
  toggleAdminSupportTicketFavoriteApi,
  toggleAdminSupportTicketStatusApi,
  claimAdminSupportTicketApi,
  fetchAdminUserDetailsApi
} from '../../../api/admin';
import { useAuthStore } from '../../../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../routes/paths';
import { useTranslation } from '../../../i18n/config';

export const AdminChatsPage: React.FC = () => {
  const { t } = useTranslation();
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
      const status = c.status as string;
      if (activeTab === 'completed') {
        return status === 'CLOSED';
      }
      if (activeTab === 'resolved') {
        return status === 'RESOLVED';
      }
      return status !== 'RESOLVED' && status !== 'CLOSED';
    })
    .sort((a, b) => {
      const timeA = new Date(a.lastMessageTime || 0).getTime();
      const timeB = new Date(b.lastMessageTime || 0).getTime();
      return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
    });

  useEffect(() => {
    if (tickets.length > 0 && !selectedTicketId) {
      queueMicrotask(() => setSelectedTicketId(tickets[0].id));
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
    <AdminLayout noPadding={true}>
      <div className="flex h-full w-full overflow-hidden bg-[#F2EBDD] text-[#0A0A0A] font-['JetBrains_Mono',monospace]">
        
        {isFilterCollapsed ? (
          <aside
            onClick={() => setIsFilterCollapsed(false)}
            className="w-14 bg-[#F2EBDD] hover:bg-white border-r-2 border-[#0A0A0A] h-full flex items-center justify-center shrink-0 cursor-pointer transition select-none z-20"
            title="Показати фільтри"
          >
            <PanelLeftOpen size={22} className="text-[#0A0A0A]" />
          </aside>
        ) : (
          <aside className="w-64 bg-[#F2EBDD] border-r-2 border-[#0A0A0A] h-full flex flex-col shrink-0 z-20">
            <div className="h-16 px-4 border-b-2 border-[#0A0A0A] flex items-center justify-between shrink-0">
              <div className="font-['Anybody',sans-serif] text-xs font-black uppercase text-[#0A0A0A] flex items-center gap-1.5">
                <Filter size={15} className="text-[#0A0A0A]" />
                <span>{t('admin.filters')}</span>
              </div>
              <div className="flex items-center space-x-1">
                {(activeTab !== 'all' || selectedPeriod !== 'all' || searchQuery.trim() || sortOrder !== 'desc') && (
                  <button
                    onClick={handleResetFilters}
                    className="p-1 text-[#0A0A0A] hover:opacity-70 transition cursor-pointer"
                    title={t('admin.reset_filters')}
                  >
                    <RotateCcw size={13} />
                  </button>
                )}
                <button
                  onClick={() => setIsFilterCollapsed(true)}
                  className="p-1 rounded-lg text-[#0A0A0A] hover:bg-white border-2 border-transparent hover:border-[#0A0A0A] transition cursor-pointer"
                  title="Сховати фільтри"
                >
                  <PanelLeftClose size={16} />
                </button>
              </div>
            </div>

            <div className="p-4 space-y-3 flex-1 overflow-y-auto custom-scrollbar">

            <div className="space-y-1 shrink-0">
              <label className="text-[10px] font-black uppercase tracking-wider text-[#0A0A0A]">
                {t('admin.search')}
              </label>
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#0A0A0A]" size={13} />
                <input
                  type="text"
                  placeholder={t('admin.search_chats_placeholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-white border-2 border-[#0A0A0A] rounded-xl text-xs font-bold text-[#0A0A0A] placeholder-slate-500 focus:outline-none transition shadow-[2px_2px_0px_#0A0A0A]"
                />
              </div>
            </div>

            <div className="space-y-1 shrink-0">
              <label className="text-[10px] font-black uppercase tracking-wider text-[#0A0A0A]">
                {t('admin.categories_label')}
              </label>
              <div className="space-y-1">
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
                      className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-black uppercase transition cursor-pointer border-2 border-[#0A0A0A] ${
                        isActive
                          ? 'bg-[#0A0A0A] text-[#F2EBDD] shadow-[2px_2px_0px_#0A0A0A]'
                          : 'bg-white text-[#0A0A0A] hover:bg-amber-50'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <IconComponent size={14} className={isActive ? 'text-[#F2EBDD]' : 'text-[#0A0A0A]'} />
                        <span>{tab.label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1 shrink-0">
              <label className="text-[10px] font-black uppercase tracking-wider text-[#0A0A0A]">
                {t('admin.period_label')}
              </label>
              <div className="space-y-1">
                {[
                  { id: 'all', label: t('admin.period_all'), icon: InfinityIcon },
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
                      className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-black uppercase transition cursor-pointer border-2 border-[#0A0A0A] ${
                        isActive
                          ? 'bg-[#0A0A0A] text-[#F2EBDD] shadow-[2px_2px_0px_#0A0A0A]'
                          : 'bg-white text-[#0A0A0A] hover:bg-amber-50'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <IconComponent size={14} className={isActive ? 'text-[#F2EBDD]' : 'text-[#0A0A0A]'} />
                        <span>{p.label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1 shrink-0">
              <label className="text-[10px] font-black uppercase tracking-wider text-[#0A0A0A]">
                {t('admin.sort_by')}
              </label>
              <div className="space-y-1">
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
                      className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-black uppercase transition cursor-pointer border-2 border-[#0A0A0A] ${
                        isActive
                          ? 'bg-[#0A0A0A] text-[#F2EBDD] shadow-[2px_2px_0px_#0A0A0A]'
                          : 'bg-white text-[#0A0A0A] hover:bg-amber-50'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <IconComponent size={14} className={isActive ? 'text-[#F2EBDD]' : 'text-[#0A0A0A]'} />
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

        <aside className="w-80 lg:w-84 bg-[#F2EBDD] border-r-2 border-[#0A0A0A] h-full flex flex-col shrink-0 z-10">
          <div className="h-16 px-4 border-b-2 border-[#0A0A0A] flex items-center justify-between shrink-0">
            <h3 className="font-['Anybody',sans-serif] text-xs font-black uppercase text-[#0A0A0A] flex items-center gap-2">
              <MessageSquare size={16} className="text-[#0A0A0A]" />
              <span>{t('admin.chats_title')}</span>
            </h3>
            <span className="px-2.5 py-0.5 rounded-lg bg-white border-2 border-[#0A0A0A] text-[#0A0A0A] font-black text-[11px] shadow-[2px_2px_0px_#0A0A0A]">
              {tickets.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar divide-y-2 divide-[#0A0A0A]/20">
            {isTicketsLoading ? (
              <div className="flex items-center justify-center py-16 text-[#0A0A0A] text-xs font-bold">
                <Loader2 size={16} className="animate-spin mr-2" />
                <span>{t('admin.loading_chats')}</span>
              </div>
            ) : tickets.length === 0 ? (
              <div className="text-center py-16 text-slate-700 text-xs font-bold px-4">
                {t('admin.no_chats_found')}
              </div>
            ) : (
              tickets.map(c => {
                const isSelected = c.id === selectedTicketId;
                return (
                  <div
                    key={c.id}
                    onClick={() => handleSelectTicket(c.id)}
                    className={`p-3.5 flex items-start gap-3 transition cursor-pointer relative ${
                      isSelected ? 'bg-white border-l-4 border-[#0A0A0A]' : 'hover:bg-white/60'
                    }`}
                  >
                    <div className="relative shrink-0">
                      {c.userAvatar ? (
                        <img src={c.userAvatar} alt={c.userName} className="w-10 h-10 rounded-xl object-cover border-2 border-[#0A0A0A]" />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-amber-200 border-2 border-[#0A0A0A] flex items-center justify-center font-black text-[#0A0A0A] text-xs shadow-[2px_2px_0px_#0A0A0A]">
                          {(c.userName || 'U')[0].toUpperCase()}
                        </div>
                      )}
                      {c.unread && (
                        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-rose-500 border-2 border-[#0A0A0A]" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className={`text-xs truncate ${c.unread ? 'font-black text-[#0A0A0A]' : 'font-bold text-[#0A0A0A]'}`}>
                          {c.userName}
                        </span>
                        <span className="text-[10px] font-mono text-slate-700 shrink-0 ml-1 font-bold">
                          {formatTime(c.lastMessageTime)}
                        </span>
                      </div>

                      <p className={`text-[11px] truncate ${c.unread ? 'font-black text-[#0A0A0A]' : 'text-slate-700 font-bold'}`}>
                        {c.lastMessage || '...'}
                      </p>
                    </div>

                    <button
                      onClick={(e) => handleToggleFavorite(c.id, e)}
                      className={`p-1 rounded-lg transition hover:bg-[#F2EBDD] shrink-0 ${
                        c.isFavorite ? 'text-amber-500' : 'text-slate-400 hover:text-amber-500'
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
          <div className="flex-1 flex flex-col h-full bg-[#F2EBDD] min-w-0">
            
            <header className="h-16 px-6 bg-[#F2EBDD] border-b-2 border-[#0A0A0A] flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-3.5 min-w-0">
                {selectedTicket.userAvatar ? (
                  <img src={selectedTicket.userAvatar} alt={selectedTicket.userName} className="w-10 h-10 rounded-xl object-cover border-2 border-[#0A0A0A] shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-amber-200 border-2 border-[#0A0A0A] flex items-center justify-center font-black text-[#0A0A0A] text-sm shrink-0 shadow-[2px_2px_0px_#0A0A0A]">
                    {(selectedTicket.userName || 'U')[0].toUpperCase()}
                  </div>
                )}

                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-['Anybody',sans-serif] text-sm font-black uppercase text-[#0A0A0A] truncate">{selectedTicket.userName}</h3>
                    <span className="px-2 py-0.5 rounded-lg bg-white border-2 border-[#0A0A0A] text-[#0A0A0A] font-black text-[10px] uppercase font-mono">
                      {selectedTicket.userPlan}
                    </span>
                  </div>
                  <div className="text-xs text-slate-700 font-mono font-bold truncate">{selectedTicket.userEmail}</div>
                </div>
              </div>
            </header>

            <div className="flex-1 p-6 overflow-y-auto overflow-x-hidden custom-scrollbar space-y-4 min-w-0 select-text">
              {(selectedTicket.messages || []).map(msg => {
                if ((msg.sender as string) === 'SYSTEM') {
                  const managerName = msg.text.replace(/^До діалогу приєднався менеджер |^Manager /, '');
                  return (
                    <div key={msg.id} className="flex justify-center my-2">
                      <div className="px-4 py-1.5 rounded-xl bg-amber-200 border-2 border-[#0A0A0A] text-[#0A0A0A] text-[11px] font-black uppercase shadow-[2px_2px_0px_#0A0A0A] flex items-center gap-1.5">
                        <UserCheck size={13} className="text-[#0A0A0A]" />
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
                      <span className="text-[10px] font-black text-[#0A0A0A] uppercase tracking-wider">
                        {isManagerMsg ? t('admin.support_team') : msg.senderName}
                      </span>
                      <span className="text-[10px] font-mono text-slate-700 font-bold">{formatTime(msg.timestamp)}</span>
                    </div>

                    <div
                      className={`p-3.5 rounded-2xl text-xs leading-relaxed border-2 border-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A] break-all [word-break:break-word] whitespace-pre-wrap ${
                        isManagerMsg
                          ? 'bg-[#0A0A0A] text-[#F2EBDD] rounded-tr-xs font-bold'
                          : 'bg-white text-[#0A0A0A] rounded-tl-xs font-bold'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-[#F2EBDD] border-t-2 border-[#0A0A0A] space-y-3 shrink-0">
              {(selectedTicket.status as string) === 'RESOLVED' || (selectedTicket.status as string) === 'CLOSED' ? (
                <div className="p-3 bg-white border-2 border-[#0A0A0A] rounded-2xl text-center space-y-1 shadow-[2px_2px_0px_#0A0A0A]">
                  <div className="text-xs font-black uppercase text-[#0A0A0A] flex items-center justify-center gap-1.5">
                    <CheckCircle2 size={15} className="text-[#0A0A0A]" />
                    <span>{t('admin.dialog_closed_title')}</span>
                  </div>
                  <p className="text-[11px] text-slate-700 font-bold">
                    {t('admin.dialog_closed_desc')}
                  </p>
                </div>
              ) : !selectedTicket.assignedManagerEmail ? (
                <div className="p-4 bg-white border-2 border-[#0A0A0A] rounded-2xl flex flex-col items-center justify-center space-y-2 text-center shadow-[2px_2px_0px_#0A0A0A]">
                  <div className="text-xs font-black uppercase text-[#0A0A0A]">
                    {t('admin.dialog_not_assigned_title')}
                  </div>
                  <button
                    type="button"
                    onClick={() => selectedTicketId && claimTicketMutation.mutate(selectedTicketId)}
                    disabled={claimTicketMutation.isPending}
                    className="px-6 py-2.5 bg-[#0A0A0A] hover:bg-[#2A2A2A] text-[#F2EBDD] font-black uppercase border-2 border-[#0A0A0A] text-xs rounded-xl transition flex items-center space-x-2 shadow-[2px_2px_0px_#0A0A0A] cursor-pointer disabled:opacity-50"
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
                <div className="p-3 bg-white border-2 border-[#0A0A0A] rounded-2xl text-center space-y-1 shadow-[2px_2px_0px_#0A0A0A]">
                  <div className="text-xs font-black uppercase text-[#0A0A0A] flex items-center justify-center gap-1.5">
                    <Lock size={15} className="text-[#0A0A0A]" />
                    <span>{t('admin.dialog_assigned_to_title', { name: selectedTicket.assignedManagerName || selectedTicket.assignedManagerEmail })}</span>
                  </div>
                  <p className="text-[11px] text-slate-700 font-bold">
                    {t('admin.dialog_assigned_to_desc')}
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-white border-2 border-[#0A0A0A] rounded-2xl flex items-center justify-between gap-3 shadow-[2px_2px_0px_#0A0A0A]">
                  <div className="text-xs font-black uppercase text-[#0A0A0A] flex items-center gap-2">
                    <Clock size={15} className="text-[#0A0A0A]" />
                    <span>{t('admin.dialog_actions_label')}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={handleCompleteDialog}
                      disabled={toggleStatusMutation.isPending}
                      className="px-3.5 py-1.5 bg-rose-200 hover:bg-rose-300 text-rose-950 border-2 border-[#0A0A0A] rounded-xl text-xs font-black uppercase transition flex items-center space-x-1.5 cursor-pointer shadow-[2px_2px_0px_#0A0A0A] disabled:opacity-50"
                    >
                      <X size={14} />
                      <span>{t('admin.complete_dialog')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleResolveDialog}
                      disabled={toggleStatusMutation.isPending}
                      className="px-3.5 py-1.5 bg-emerald-200 hover:bg-emerald-300 text-emerald-950 border-2 border-[#0A0A0A] rounded-xl text-xs font-black uppercase transition flex items-center space-x-1.5 cursor-pointer shadow-[2px_2px_0px_#0A0A0A] disabled:opacity-50"
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
                    (selectedTicket.status as string) === 'RESOLVED' || (selectedTicket.status as string) === 'CLOSED'
                      ? t('admin.placeholder_dialog_closed')
                      : !selectedTicket.assignedManagerEmail
                      ? t('admin.placeholder_start_dialog')
                      : selectedTicket.assignedManagerEmail !== currentUser?.email
                      ? t('admin.placeholder_other_manager')
                      : t('admin.type_reply_placeholder')
                  }
                  value={replyText}
                  disabled={
                    (selectedTicket.status as string) === 'RESOLVED' ||
                    (selectedTicket.status as string) === 'CLOSED' ||
                    !selectedTicket.assignedManagerEmail ||
                    selectedTicket.assignedManagerEmail !== currentUser?.email
                  }
                  onChange={(e) => setReplyText(e.target.value)}
                  className="flex-1 px-4 py-2.5 bg-white border-2 border-[#0A0A0A] rounded-2xl text-xs font-bold text-[#0A0A0A] placeholder-slate-500 focus:outline-none transition shadow-[2px_2px_0px_#0A0A0A] disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  type="submit"
                  disabled={
                    !replyText.trim() ||
                    sendMessageMutation.isPending ||
                    (selectedTicket.status as string) === 'RESOLVED' ||
                    (selectedTicket.status as string) === 'CLOSED' ||
                    !selectedTicket.assignedManagerEmail ||
                    selectedTicket.assignedManagerEmail !== currentUser?.email
                  }
                  className="px-5 py-2.5 bg-[#0A0A0A] hover:bg-[#2A2A2A] text-[#F2EBDD] font-black uppercase text-xs border-2 border-[#0A0A0A] rounded-2xl disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center space-x-1.5 shadow-[2px_2px_0px_#0A0A0A] cursor-pointer"
                >
                  {sendMessageMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  <span>{t('admin.send_btn')}</span>
                </button>
              </form>
            </div>

          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-700 text-xs font-bold">
            {t('admin.select_chat_hint')}
          </div>
        )}

        {selectedTicket && (
          isProfileCollapsed ? (
            <aside
              onClick={() => setIsProfileCollapsed(false)}
              className="w-14 bg-[#F2EBDD] hover:bg-white border-l-2 border-[#0A0A0A] h-full flex items-center justify-center shrink-0 cursor-pointer transition select-none z-10"
              title="Показати інфо про клієнта"
            >
              <PanelRightOpen size={22} className="text-[#0A0A0A]" />
            </aside>
          ) : (
            <aside className="w-80 bg-[#F2EBDD] border-l-2 border-[#0A0A0A] h-full flex flex-col shrink-0 z-10 select-text">
              <div className="h-16 px-5 border-b-2 border-[#0A0A0A] flex items-center justify-between shrink-0">
                <h5 className="font-['Anybody',sans-serif] text-xs font-black uppercase text-[#0A0A0A]">
                  {t('admin.client_info')}
                </h5>
                <button
                  onClick={() => setIsProfileCollapsed(true)}
                  className="p-1 rounded-lg text-[#0A0A0A] hover:bg-white border-2 border-transparent hover:border-[#0A0A0A] transition cursor-pointer"
                  title="Сховати інфо про клієнта"
                >
                  <PanelRightClose size={16} />
                </button>
              </div>

              <div className="p-5 space-y-5 overflow-y-auto flex-1 custom-scrollbar">

              <div className="text-center space-y-2 border-b-2 border-[#0A0A0A] pb-4">
                {selectedTicket.userAvatar ? (
                  <img src={selectedTicket.userAvatar} alt={selectedTicket.userName} className="w-16 h-16 rounded-2xl object-cover border-2 border-[#0A0A0A] mx-auto shadow-[2px_2px_0px_#0A0A0A]" />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-amber-200 border-2 border-[#0A0A0A] flex items-center justify-center font-black text-[#0A0A0A] text-xl mx-auto shadow-[2px_2px_0px_#0A0A0A]">
                    {(selectedTicket.userName || 'U')[0].toUpperCase()}
                  </div>
                )}
                <div>
                  <h4 className="font-black text-[#0A0A0A] text-sm">{selectedTicket.userName}</h4>
                  <p className="text-xs text-slate-700 font-mono font-bold truncate">{selectedTicket.userEmail}</p>
                </div>
                <div className="flex items-center justify-center gap-2 pt-1">
                  <span className="px-2.5 py-0.5 rounded-lg bg-white border-2 border-[#0A0A0A] text-[#0A0A0A] font-black text-[10px] uppercase font-mono">
                    {selectedTicket.userPlan}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-lg border-2 border-[#0A0A0A] font-black text-[10px] uppercase font-mono ${
                    selectedTicket.accountActive !== false
                      ? 'bg-emerald-200 text-emerald-950'
                      : 'bg-rose-200 text-rose-950'
                  }`}>
                    {selectedTicket.accountActive !== false ? t('admin.status_active_user') : t('admin.status_blocked_user')}
                  </span>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <h5 className="font-black text-[10px] uppercase tracking-wider text-[#0A0A0A]">
                  {t('admin.activity_and_stats')}
                </h5>
                
                <div className="bg-white p-3.5 rounded-2xl border-2 border-[#0A0A0A] space-y-2.5 font-bold shadow-[2px_2px_0px_#0A0A0A]">
                  <div className="flex items-center justify-between text-[#0A0A0A]">
                    <span className="flex items-center gap-1.5"><Calendar size={13} /> {t('admin.reg_date')}</span>
                    <span className="font-black text-[#0A0A0A] font-mono text-[11px]">
                      {formatDate(selectedTicket.registeredAt)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[#0A0A0A]">
                    <span className="flex items-center gap-1.5"><Clock size={13} /> {t('admin.last_activity')}</span>
                    <span className="font-black text-[#0A0A0A] font-mono text-[11px]">
                      {formatDate(selectedTicket.lastActivityAt)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[#0A0A0A]">
                    <span className="flex items-center gap-1.5"><Key size={13} /> {t('admin.auth_provider')}</span>
                    <span className="font-black text-[#0A0A0A] font-mono text-[11px]">
                      {getAuthProviderLabel(selectedTicket.authProvider)}
                    </span>
                  </div>
                  {selectedTicket.telegramUserId && (
                    <div className="flex items-center justify-between text-[#0A0A0A]">
                      <span className="flex items-center gap-1.5"><Send size={13} /> {t('admin.telegram_id')}</span>
                      <span className="font-black text-[#0A0A0A] font-mono text-[11px]">
                        {selectedTicket.telegramUserId}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <h5 className="font-black text-[10px] uppercase tracking-wider text-[#0A0A0A]">
                  Ресурси користувача
                </h5>
                
                <div className="bg-white p-3.5 rounded-2xl border-2 border-[#0A0A0A] space-y-2 font-bold shadow-[2px_2px_0px_#0A0A0A]">
                  <div className="flex items-center justify-between text-[#0A0A0A]">
                    <span className="flex items-center gap-1.5"><Bot size={13} /> {t('admin.bots_label')}</span>
                    <span className="font-black font-mono text-[#0A0A0A]">{selectedTicket.botsCount}</span>
                  </div>
                  <div className="flex items-center justify-between text-[#0A0A0A]">
                    <span className="flex items-center gap-1.5"><Workflow size={13} /> {t('admin.automations_label')}</span>
                    <span className="font-black font-mono text-[#0A0A0A]">{selectedTicket.automationsCount}</span>
                  </div>
                  <div className="flex items-center justify-between text-[#0A0A0A]">
                    <span className="flex items-center gap-1.5"><Send size={13} /> {t('admin.broadcasts_label')}</span>
                    <span className="font-black font-mono text-[#0A0A0A]">{selectedTicket.broadcastsCount}</span>
                  </div>
                  <div className="flex items-center justify-between text-[#0A0A0A]">
                    <span className="flex items-center gap-1.5"><Users size={13} /> {t('admin.subscribers')}</span>
                    <span className="font-black font-mono text-[#0A0A0A]">{selectedTicket.contactsCount ?? 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-[#0A0A0A]">
                    <span className="flex items-center gap-1.5"><MessageSquare size={13} /> {t('admin.messages_sent')}</span>
                    <span className="font-black font-mono text-[#0A0A0A]">{selectedTicket.messagesCount ?? 0}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => {
                    setActivityPage(0);
                    setShowDetailModal(true);
                  }}
                  className="w-full py-2.5 px-3 bg-[#0A0A0A] hover:bg-[#2A2A2A] text-[#F2EBDD] rounded-xl border-2 border-[#0A0A0A] text-xs font-black uppercase transition flex items-center justify-center cursor-pointer shadow-[2px_2px_0px_#0A0A0A]"
                >
                  <span>{t('admin.more_details')}</span>
                </button>
              </div>
            </div>
          </aside>
        )
      )}

        {showDetailModal && selectedTicket && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A0A0A]/40 backdrop-blur-xs p-4 animate-in fade-in duration-150 font-['JetBrains_Mono',monospace]">
            <div className="bg-[#F2EBDD] border-4 border-[#0A0A0A] rounded-3xl w-full max-w-6xl h-[780px] max-h-[92vh] p-6 sm:p-7 shadow-[10px_10px_0px_#0A0A0A] flex flex-col justify-between space-y-4 overflow-hidden text-[#0A0A0A]">
              <div className="flex items-center justify-between border-b-2 border-[#0A0A0A] pb-3.5 shrink-0">
                <div className="flex items-center space-x-3.5">
                  {selectedTicket.userAvatar ? (
                    <img
                      src={selectedTicket.userAvatar}
                      alt={selectedTicket.userName}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-2xl object-cover border-2 border-[#0A0A0A]"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-2xl bg-amber-200 border-2 border-[#0A0A0A] flex items-center justify-center font-black text-[#0A0A0A] text-lg shadow-[2px_2px_0px_#0A0A0A]">
                      {selectedTicket.userName ? selectedTicket.userName[0].toUpperCase() : 'U'}
                    </div>
                  )}

                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-['Anybody',sans-serif] text-base font-black uppercase text-[#0A0A0A] leading-tight">{selectedTicket.userName}</h3>
                      <span className="px-2 py-0.5 rounded-lg bg-white border-2 border-[#0A0A0A] text-[#0A0A0A] font-black text-[10px] uppercase">
                        {selectedTicket.userRole || 'ROLE_OWNER'}
                      </span>
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase border-2 border-[#0A0A0A] ${
                        selectedTicket.accountActive !== false
                          ? 'bg-emerald-200 text-emerald-950'
                          : 'bg-rose-200 text-rose-950'
                      }`}>
                        {selectedTicket.accountActive !== false ? t('admin.active') : t('admin.blocked')}
                      </span>
                    </div>

                    <div className="text-xs text-slate-700 font-mono font-bold flex items-center space-x-2">
                      <span>{selectedTicket.userEmail}</span>
                      <span>ID: #{selectedTicket.userId}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="p-1.5 text-[#0A0A0A] hover:bg-white rounded-xl border-2 border-transparent hover:border-[#0A0A0A] transition cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 bg-white p-2.5 rounded-2xl border-2 border-[#0A0A0A] shrink-0 shadow-[2px_2px_0px_#0A0A0A]">
                <div className="flex items-center space-x-1">
                  <span className="text-[11px] font-black uppercase text-[#0A0A0A] mr-1 flex items-center gap-1">
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
                      className={`px-2.5 py-1 rounded-xl text-xs font-black uppercase transition cursor-pointer ${
                        detailPeriod === p.id
                          ? 'bg-[#0A0A0A] text-[#F2EBDD]'
                          : 'text-[#0A0A0A] hover:bg-[#F2EBDD]'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center space-x-1">
                  <span className="text-[11px] font-black uppercase text-[#0A0A0A] mr-1 flex items-center gap-1">
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
                      className={`px-2.5 py-1 rounded-xl text-xs font-black uppercase transition cursor-pointer ${
                        activityCategoryFilter === c.id
                          ? 'bg-[#0A0A0A] text-[#F2EBDD]'
                          : 'text-[#0A0A0A] hover:bg-[#F2EBDD]'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-6 gap-2 shrink-0">
                <div className="bg-white border-2 border-[#0A0A0A] rounded-xl p-2.5 shadow-[2px_2px_0px_#0A0A0A]">
                  <div className="text-[10px] font-black uppercase text-slate-700">{t('admin.active_bots')}</div>
                  <div className="text-base font-black text-[#0A0A0A] mt-0.5">
                    {isDetailLoading ? '...' : (userDetailData?.botsCount ?? selectedTicket.botsCount)}
                  </div>
                </div>

                <div className="bg-white border-2 border-[#0A0A0A] rounded-xl p-2.5 shadow-[2px_2px_0px_#0A0A0A]">
                  <div className="text-[10px] font-black uppercase text-slate-700">{t('admin.cat_automations')}</div>
                  <div className="text-base font-black text-[#0A0A0A] mt-0.5">
                    {isDetailLoading ? '...' : (userDetailData?.automationsCount ?? selectedTicket.automationsCount)}
                  </div>
                </div>

                <div className="bg-white border-2 border-[#0A0A0A] rounded-xl p-2.5 shadow-[2px_2px_0px_#0A0A0A]">
                  <div className="text-[10px] font-black uppercase text-slate-700">{t('admin.cat_broadcasts')}</div>
                  <div className="text-base font-black text-[#0A0A0A] mt-0.5">
                    {isDetailLoading ? '...' : (userDetailData?.broadcastsCount ?? selectedTicket.broadcastsCount)}
                  </div>
                </div>

                <div className="bg-white border-2 border-[#0A0A0A] rounded-xl p-2.5 shadow-[2px_2px_0px_#0A0A0A]">
                  <div className="text-[10px] font-black uppercase text-slate-700">{t('admin.subscribers')}</div>
                  <div className="text-base font-black text-[#0A0A0A] mt-0.5">
                    {isDetailLoading ? '...' : (userDetailData?.contactsCount ?? selectedTicket.contactsCount ?? 0)}
                  </div>
                </div>

                <div className="bg-white border-2 border-[#0A0A0A] rounded-xl p-2.5 shadow-[2px_2px_0px_#0A0A0A]">
                  <div className="text-[10px] font-black uppercase text-slate-700">{t('admin.messages_sent')}</div>
                  <div className="text-base font-black text-[#0A0A0A] mt-0.5">
                    {isDetailLoading ? '...' : (userDetailData?.messagesCount ?? selectedTicket.messagesCount ?? 0)}
                  </div>
                </div>

                <div className="bg-white border-2 border-[#0A0A0A] rounded-xl p-2.5 shadow-[2px_2px_0px_#0A0A0A]">
                  <div className="text-[10px] font-black uppercase text-slate-700">{t('admin.subscription_plan')}</div>
                  <div className="text-xs font-black uppercase text-[#0A0A0A] mt-1 truncate">
                    {selectedTicket.userPlan}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 flex-1 min-h-0 overflow-hidden">
                <div className="lg:col-span-5 flex flex-col space-y-3 min-h-0 h-full overflow-hidden">
                  
                  <div className="flex-1 flex flex-col min-h-0 border-2 border-[#0A0A0A] rounded-2xl bg-white p-3 overflow-hidden shadow-[2px_2px_0px_#0A0A0A]">
                    <div className="flex items-center justify-between pb-2 border-b-2 border-[#0A0A0A] text-xs font-black uppercase text-[#0A0A0A] shrink-0">
                      <span>{t('admin.automations')}</span>
                      {userDetailData?.automations && (
                        <span className="text-[11px] font-mono text-slate-700 font-bold">
                          {t('admin.total')}: {userDetailData.automations.length}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pt-2 pr-1">
                      {isDetailLoading ? (
                        <div className="flex items-center justify-center py-6 text-[#0A0A0A] text-xs font-bold">
                          <Loader2 size={16} className="animate-spin mr-2" />
                          {t('admin.loading_history')}
                        </div>
                      ) : !userDetailData?.automations?.length ? (
                        <div className="text-center py-6 text-slate-700 text-xs font-bold">
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
                            className="bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-xl p-2.5 hover:bg-white cursor-pointer transition group flex flex-col justify-between"
                            title="Перейти до цієї автоматизації"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center space-x-2 min-w-0">
                                <span
                                  className={`w-2.5 h-2.5 rounded-full shrink-0 border border-[#0A0A0A] ${
                                    auto.active ? 'bg-emerald-400' : 'bg-slate-300'
                                  }`}
                                />
                                <span className="font-black text-[#0A0A0A] text-xs truncate group-hover:underline transition">
                                  {auto.name}
                                </span>
                              </div>
                              <div className="flex items-center space-x-1 shrink-0">
                                <span className="px-1.5 py-0.5 rounded bg-white border border-[#0A0A0A] text-[9px] font-black text-[#0A0A0A] uppercase font-mono">
                                  {auto.triggerType}
                                </span>
                                <ChevronRight size={14} className="text-[#0A0A0A]" />
                              </div>
                            </div>
                            <div className="text-[10px] text-slate-700 font-mono font-bold mt-1">
                              {auto.botName ? `Bot: ${auto.botName}` : `Updated: ${formatEuroDateTime((auto as any).updatedAt)}`}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col min-h-0 border-2 border-[#0A0A0A] rounded-2xl bg-white p-3 overflow-hidden shadow-[2px_2px_0px_#0A0A0A]">
                    <div className="flex items-center justify-between pb-2 border-b-2 border-[#0A0A0A] text-xs font-black uppercase text-[#0A0A0A] shrink-0">
                      <span>{t('admin.broadcasts')}</span>
                      {userDetailData?.broadcasts && (
                        <span className="text-[11px] font-mono text-slate-700 font-bold">
                          {t('admin.total')}: {userDetailData.broadcasts.length}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pt-2 pr-1">
                      {isDetailLoading ? (
                        <div className="flex items-center justify-center py-6 text-[#0A0A0A] text-xs font-bold">
                          <Loader2 size={16} className="animate-spin mr-2" />
                          {t('admin.loading_history')}
                        </div>
                      ) : !userDetailData?.broadcasts?.length ? (
                        <div className="text-center py-6 text-slate-700 text-xs font-bold">
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
                            className="bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-xl p-2.5 hover:bg-white cursor-pointer transition group flex flex-col justify-between"
                            title="Перейти до цього бродкасту"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="font-black text-[#0A0A0A] text-xs truncate group-hover:underline transition">
                                {b.name}
                              </span>
                              <div className="flex items-center space-x-1 shrink-0">
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase font-mono border border-[#0A0A0A] ${
                                    b.status === 'COMPLETED'
                                      ? 'bg-emerald-200 text-emerald-950'
                                      : b.status === 'RUNNING'
                                      ? 'bg-cyan-200 text-cyan-950'
                                      : 'bg-amber-200 text-amber-950'
                                  }`}
                                >
                                  {b.status}
                                </span>
                                <ChevronRight size={14} className="text-[#0A0A0A]" />
                              </div>
                            </div>
                            <div className="text-[10px] text-slate-700 font-mono font-bold mt-1 flex justify-between">
                              <span>Sent: {b.sentCount ?? 0}</span>
                              <span>{formatEuroDateTime(b.createdAt)}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-7 border-2 border-[#0A0A0A] rounded-2xl bg-white p-3.5 flex flex-col min-h-0 h-full overflow-hidden shadow-[2px_2px_0px_#0A0A0A]">
                  <div className="flex items-center justify-between pb-2 border-b-2 border-[#0A0A0A] text-xs font-black uppercase text-[#0A0A0A] shrink-0">
                    <span>{t('admin.activity_history')}</span>
                    {userDetailData?.activities && (
                      <span className="text-[11px] font-mono text-slate-700 font-bold">
                        {t('admin.total_records')} {userDetailData.activities.totalElements}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pt-2 pr-1">
                    {isDetailLoading ? (
                      <div className="flex items-center justify-center py-12 text-[#0A0A0A] text-xs font-bold">
                        <Loader2 size={16} className="animate-spin mr-2" />
                        {t('admin.loading_history')}
                      </div>
                    ) : userDetailData?.activities?.content && userDetailData.activities.content.length > 0 ? (
                      <div className="space-y-2">
                        {userDetailData.activities.content.map((act) => (
                          <div key={act.id} className="bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-xl p-3 flex items-start justify-between text-xs hover:bg-white transition">
                            <div className="space-y-1 min-w-0 pr-2">
                              <div className="font-black text-[#0A0A0A] flex items-center space-x-2 truncate">
                                <span className="truncate">{translateAuditTitle(act.title)}</span>
                                <span className="px-1.5 py-0.2 rounded bg-white border border-[#0A0A0A] text-[#0A0A0A] font-mono text-[9px] uppercase font-black shrink-0">
                                  {act.badge}
                                </span>
                              </div>
                              <div className="text-slate-800 text-[11px] font-bold leading-relaxed">{translateAuditDescription(act.description)}</div>
                            </div>
                            <div className="text-[11px] text-slate-700 font-mono font-bold shrink-0">
                              {formatEuroDateTime(act.timestamp)}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-slate-700 text-xs font-bold">
                        {t('admin.no_records')}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t-2 border-[#0A0A0A] shrink-0">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setActivityPage((prev) => Math.max(0, prev - 1))}
                    disabled={activityPage === 0 || isDetailLoading}
                    className="px-3 py-1.5 rounded-xl border-2 border-[#0A0A0A] bg-white text-[#0A0A0A] text-xs font-black uppercase hover:bg-[#0A0A0A] hover:text-[#F2EBDD] disabled:opacity-40 cursor-pointer flex items-center gap-1 shadow-[2px_2px_0px_#0A0A0A]"
                  >
                    <ChevronLeft size={14} />
                    <span>{t('admin.prev_page')}</span>
                  </button>

                  <span className="text-xs text-[#0A0A0A] font-mono font-black px-1">
                    {t('admin.page_x_of_y', { current: activityPage + 1, total: userDetailData?.activities?.totalPages || 1 })}
                  </span>

                  <button
                    onClick={() => setActivityPage((prev) => prev + 1)}
                    disabled={!userDetailData?.activities || activityPage + 1 >= userDetailData.activities.totalPages || isDetailLoading}
                    className="px-3 py-1.5 rounded-xl border-2 border-[#0A0A0A] bg-white text-[#0A0A0A] text-xs font-black uppercase hover:bg-[#0A0A0A] hover:text-[#F2EBDD] disabled:opacity-40 cursor-pointer flex items-center gap-1 shadow-[2px_2px_0px_#0A0A0A]"
                  >
                    <span>{t('admin.next_page')}</span>
                    <ChevronRight size={14} />
                  </button>
                </div>

                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-6 py-2 rounded-xl text-xs font-black uppercase text-[#F2EBDD] bg-[#0A0A0A] border-2 border-[#0A0A0A] hover:bg-[#2A2A2A] cursor-pointer transition shadow-[2px_2px_0px_#0A0A0A]"
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
