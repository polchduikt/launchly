import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { fetchAdminAutomationsApi, fetchAdminAutomationDetailsApi, toggleAutomationApi, blockAutomationApi, unblockAutomationApi } from '../api/adminApi';
import { AdminLayout } from '../layouts/AdminLayout';
import { useAuthStore } from '../../../store/useAuthStore';
import { Bot, Play, Pause, Loader2, Search, ChevronDown, ChevronLeft, ChevronRight, X, Workflow, Layers, Zap, AlertTriangle, Calendar, Clock, ShieldAlert, Lock, Unlock, Filter } from 'lucide-react';
import { useTranslation } from '../../../i18n/config';
import { ROUTES } from '../../../constants/routes';

const PAGE_SIZE = 30;

export const AdminAutomationsPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);
  const isAdmin = currentUser?.role === 'ROLE_ADMIN';

  const [search, setSearch] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paused' | 'blocked'>('all');
  const [sortFilter, setSortFilter] = useState<'desc' | 'asc'>('desc');
  const [page, setPage] = useState(0);

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isBulkActionOpen, setIsBulkActionOpen] = useState(false);
  const bulkActionDropdownRef = useRef<HTMLDivElement>(null);

  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  const [showBlockModal, setShowBlockModal] = useState(false);
  const [selectedBlockAutomation, setSelectedBlockAutomation] = useState<any | null>(null);
  const [blockReasonOption, setBlockReasonOption] = useState('SUSPICIOUS');
  const [customBlockReason, setCustomBlockReason] = useState('');

  useEffect(() => {
    const param = searchParams.get('search');
    if (param !== null) {
      setSearch(param);
      setPage(0);
    }
  }, [searchParams]);

  const [selectedDetailAutomation, setSelectedDetailAutomation] = useState<any | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailPeriod, setDetailPeriod] = useState<'week' | 'month' | '3months' | 'all'>('all');
  const [activityPage, setActivityPage] = useState(0);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setIsStatusDropdownOpen(false);
      }
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setIsSortDropdownOpen(false);
      }
      if (bulkActionDropdownRef.current && !bulkActionDropdownRef.current.contains(event.target as Node)) {
        setIsBulkActionOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ['adminAutomations', search, statusFilter, sortFilter, page],
    queryFn: () => fetchAdminAutomationsApi(search, statusFilter, sortFilter, page, 30),
  });

  const automations = data?.content || [];
  const totalElements = data?.totalElements || 0;
  const totalPages = data?.totalPages || 1;

  const allIdsOnPage = automations.map((a: any) => a.id);
  const isAllSelected = allIdsOnPage.length > 0 && allIdsOnPage.every((id: number) => selectedIds.includes(id));

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(allIdsOnPage);
    }
  };

  const handleToggleSelectRow = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBulkPause = () => {
    const targets = automations.filter((a: any) => selectedIds.includes(a.id) && !a.blocked && a.active);
    targets.forEach((a: any) => toggleMutation.mutate(a.id));
    setSelectedIds([]);
    setIsBulkActionOpen(false);
  };

  const handleBulkResume = () => {
    const targets = automations.filter((a: any) => selectedIds.includes(a.id) && !a.blocked && !a.active);
    targets.forEach((a: any) => toggleMutation.mutate(a.id));
    setSelectedIds([]);
    setIsBulkActionOpen(false);
  };

  const handleBulkBlock = () => {
    const targets = automations.filter((a: any) => selectedIds.includes(a.id) && !a.blocked);
    targets.forEach((a: any) => blockMutation.mutate({ id: a.id, reason: 'Bulk admin action' }));
    setSelectedIds([]);
    setIsBulkActionOpen(false);
  };

  const handleBulkUnblock = () => {
    const targets = automations.filter((a: any) => selectedIds.includes(a.id) && a.blocked);
    targets.forEach((a: any) => unblockMutation.mutate(a.id));
    setSelectedIds([]);
    setIsBulkActionOpen(false);
  };

  const { data: automationDetailData, isLoading: isDetailLoading } = useQuery({
    queryKey: ['adminAutomationDetails', selectedDetailAutomation?.id, detailPeriod, activityPage],
    queryFn: () => fetchAdminAutomationDetailsApi(selectedDetailAutomation.id, detailPeriod, activityPage, 20),
    enabled: !!selectedDetailAutomation && showDetailModal
  });

  const handleOpenDetailModal = (item: any) => {
    setSelectedDetailAutomation(item);
    setActivityPage(0);
    setShowDetailModal(true);
  };

  const toggleMutation = useMutation({
    mutationFn: (id: number) => toggleAutomationApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminAutomations'] });
    },
  });

  const blockMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => blockAutomationApi(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminAutomations'] });
      queryClient.invalidateQueries({ queryKey: ['adminAutomationDetails'] });
      setShowBlockModal(false);
      setSelectedBlockAutomation(null);
    },
  });

  const unblockMutation = useMutation({
    mutationFn: (id: number) => unblockAutomationApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminAutomations'] });
      queryClient.invalidateQueries({ queryKey: ['adminAutomationDetails'] });
    },
  });

  const handleConfirmBlockAutomation = () => {
    if (!selectedBlockAutomation) return;
    let finalReason = '';
    if (blockReasonOption === 'SUSPICIOUS') {
      finalReason = 'Suspicious activity';
    } else if (blockReasonOption === 'RULES') {
      finalReason = 'Violation of platform rules';
    } else if (blockReasonOption === 'SPAM') {
      finalReason = 'Spam or unauthorized bulk messaging';
    } else {
      finalReason = customBlockReason.trim() || 'Other reason';
    }
    blockMutation.mutate({ id: selectedBlockAutomation.id, reason: finalReason });
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

  const translateAuditTitle = (title: string) => {
    if (!title) return '';
    if (title.startsWith('Реєстрація у Launchly') || title.startsWith('Registered in Launchly')) {
      return t('audit.user_registration.title');
    }
    if (title.startsWith('Авторизація користувача') || title.startsWith('User Authentication')) {
      return t('audit.user_auth.title');
    }
    if (title.startsWith('Підключення бота:') || title.startsWith('Bot Connected:')) {
      const name = title.split(':')[1]?.trim() || '';
      return t('audit.bot_connected.title', { botName: name });
    }
    if (title.startsWith('Модифікація автоматизації:') || title.startsWith('Automation Modified:')) {
      const name = title.split(':')[1]?.trim() || '';
      return t('audit.automation_modified.title', { botName: name });
    }
    if (title.startsWith('Запуск розсилки') || title.startsWith('Broadcast Launched')) {
      return t('audit.broadcast_launched.title');
    }
    return title;
  };

  const translateAuditDescription = (desc: string) => {
    if (!desc) return '';
    if (desc.includes('Оновлено структуру бот-схеми') || desc.includes('Updated flow schema')) {
      return t('audit.automation_modified.desc');
    }
    if (desc.includes('Створено та активовано бота у системі') || desc.includes('Created and activated bot')) {
      const botIdMatch = desc.match(/#(\d+)/);
      const botId = botIdMatch ? botIdMatch[1] : '';
      return t('audit.bot_connected.desc', { botId });
    }
    return desc;
  };

  const statusOptions = [
    { value: 'all', label: t('admin.all_statuses') !== 'admin.all_statuses' ? t('admin.all_statuses') : 'Всі статуси' },
    { value: 'active', label: t('admin.status_active') !== 'admin.status_active' ? t('admin.status_active') : 'Активні' },
    { value: 'paused', label: t('admin.status_paused') !== 'admin.status_paused' ? t('admin.status_paused') : 'На паузі' },
    { value: 'blocked', label: t('admin.status_blocked') !== 'admin.status_blocked' ? t('admin.status_blocked') : 'Заблоковані' },
  ];

  const getStatusLabel = (val: string) => {
    const found = statusOptions.find((o) => o.value === val);
    return found ? found.label : (t('admin.all_statuses') !== 'admin.all_statuses' ? t('admin.all_statuses') : 'Всі статуси');
  };

  const blockReasonsList = [
    { code: 'SUSPICIOUS', key: 'admin.reason_suspicious' },
    { code: 'RULES', key: 'admin.reason_rules' },
    { code: 'SPAM', key: 'admin.reason_spam' },
    { code: 'OTHER', key: 'admin.reason_other' },
  ];

  return (
    <AdminLayout noPadding>
      <div className="flex h-full w-full overflow-hidden">
        
        <aside className="w-56 lg:w-60 bg-white border-r border-slate-200 h-full p-4 space-y-5 overflow-y-auto shrink-0 flex flex-col justify-between z-10">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-[11px] uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <Filter size={14} className="text-indigo-600" />
                <span>{t('admin.filters_title')}</span>
              </h3>
              {(statusFilter !== 'all' || sortFilter !== 'desc') && (
                <button
                  onClick={() => {
                    setStatusFilter('all');
                    setSortFilter('desc');
                    setPage(0);
                  }}
                  className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 transition cursor-pointer"
                >
                  {t('admin.reset_filters')}
                </button>
              )}
            </div>

            <div className="space-y-1" ref={statusDropdownRef}>
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">{t('admin.status_filter_label')}</label>
              <div className="relative w-full">
                <button
                  type="button"
                  onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                  className="w-full flex items-center justify-between px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-white hover:border-slate-300 transition-all cursor-pointer shadow-2xs"
                >
                  <span>{getStatusLabel(statusFilter)}</span>
                  <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${isStatusDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isStatusDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1 animate-in fade-in-50 slide-in-from-top-1 duration-150 font-sans">
                    {statusOptions.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setStatusFilter(opt.value as any);
                          setPage(0);
                          setIsStatusDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 text-xs font-semibold flex items-center justify-between transition-colors ${
                          statusFilter === opt.value
                            ? 'bg-indigo-50 text-indigo-600 font-bold'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span>{opt.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-1" ref={sortDropdownRef}>
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">{t('admin.sorting_label')}</label>
              <div className="relative w-full">
                <button
                  type="button"
                  onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                  className="w-full flex items-center justify-between px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-white hover:border-slate-300 transition-all cursor-pointer shadow-2xs"
                >
                  <span>{sortFilter === 'asc' ? t('admin.sort_oldest') : t('admin.sort_newest')}</span>
                  <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${isSortDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isSortDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1 animate-in fade-in-50 slide-in-from-top-1 duration-150 font-sans">
                    {[
                      { value: 'desc', label: t('admin.sort_newest') },
                      { value: 'asc', label: t('admin.sort_oldest') },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setSortFilter(opt.value as 'desc' | 'asc');
                          setPage(0);
                          setIsSortDropdownOpen(false);
                        }}
                        className={`w-full px-3 py-1.5 text-left text-xs font-semibold flex items-center justify-between hover:bg-slate-50 transition cursor-pointer ${
                          sortFilter === opt.value ? 'text-indigo-600 bg-indigo-50/50 font-bold' : 'text-slate-700'
                        }`}
                      >
                        <span>{opt.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto p-6 lg:p-8 min-w-0 h-full bg-slate-50 space-y-4">
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3 flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                <input
                  type="text"
                  placeholder={t('admin.search_automations_placeholder') !== 'admin.search_automations_placeholder' ? t('admin.search_automations_placeholder') : 'Пошук назви, власника або бота...'}
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(0);
                  }}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-all shadow-2xs"
                />
              </div>
              {selectedIds.length > 0 && (
                <span className="px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-extrabold text-xs animate-in fade-in duration-150 shrink-0">
                  {t('admin.selected_count', { count: selectedIds.length })}
                </span>
              )}
            </div>

            <div className="relative shrink-0" ref={bulkActionDropdownRef}>
              <button
                type="button"
                disabled={selectedIds.length === 0}
                onClick={() => setIsBulkActionOpen(!isBulkActionOpen)}
                className="flex items-center space-x-2.5 px-5 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-full text-xs font-semibold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-2xs cursor-pointer"
              >
                <span>{t('admin.bulk_actions')}</span>
                <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${isBulkActionOpen ? 'rotate-180' : ''}`} />
              </button>

              {isBulkActionOpen && selectedIds.length > 0 && (
                <div className="absolute right-0 top-full mt-1.5 w-52 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 py-1.5 animate-in fade-in-50 slide-in-from-top-1 duration-150 font-sans">
                  <button
                    type="button"
                    onClick={handleBulkPause}
                    className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-amber-50 hover:text-amber-600 flex items-center space-x-2.5 transition cursor-pointer"
                  >
                    <Pause size={14} className="text-amber-500" />
                    <span>{t('admin.bulk_pause')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleBulkResume}
                    className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-600 flex items-center space-x-2.5 transition cursor-pointer"
                  >
                    <Play size={14} className="text-emerald-500" />
                    <span>{t('admin.bulk_resume')}</span>
                  </button>
                  {isAdmin && (
                    <>
                      <div className="my-1 border-t border-slate-100" />
                      <button
                        type="button"
                        onClick={handleBulkBlock}
                        className="w-full text-left px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center space-x-2.5 transition cursor-pointer"
                      >
                        <Lock size={14} />
                        <span>{t('admin.bulk_block')}</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleBulkUnblock}
                        className="w-full text-left px-4 py-2 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 flex items-center space-x-2.5 transition cursor-pointer"
                      >
                        <Unlock size={14} />
                        <span>{t('admin.bulk_unblock')}</span>
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20 bg-white border border-slate-200 rounded-3xl">
            <Loader2 className="animate-spin text-indigo-600" size={32} />
          </div>
        ) : (
          <>
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="py-3.5 px-4 text-center w-10">
                          <input
                            type="checkbox"
                            checked={isAllSelected}
                            onChange={handleToggleSelectAll}
                            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer accent-indigo-600"
                          />
                        </th>
                        <th className="py-3.5 px-4">{t('admin.flow_schema_col')}</th>
                        <th className="py-3.5 px-4 text-center">{t('admin.owner_col')}</th>
                        <th className="py-3.5 px-4 text-center">{t('admin.target_bot_col')}</th>
                        <th className="py-3.5 px-4 text-center">{t('admin.executions_col')}</th>
                        <th className="py-3.5 px-4 text-center">{t('admin.errors_col')}</th>
                        <th className="py-3.5 px-4 text-center">{t('admin.status_col')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {automations.map((item) => (
                        <tr
                          key={item.id}
                          onClick={() => handleOpenDetailModal(item)}
                          className={`transition cursor-pointer group ${
                            item.blocked
                              ? 'bg-slate-100/80 border-b border-slate-200 hover:bg-slate-200/60'
                              : 'hover:bg-slate-50/80'
                          }`}
                          title="Переглянути деталі та статистику автоматизації"
                        >
                          <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(item.id)}
                              onChange={() => handleToggleSelectRow(item.id)}
                              className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer accent-indigo-600"
                            />
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition">{item.name}</span>
                              <span className="text-[10px] font-bold text-indigo-600 font-mono">Trigger: {item.triggerType}</span>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`${ROUTES.ADMIN_USERS}?search=${encodeURIComponent(item.ownerEmail)}`);
                              }}
                              className="flex flex-col items-center justify-center cursor-pointer group/owner inline-flex hover:opacity-80 transition"
                              title={t('admin.view_owner') !== 'admin.view_owner' ? t('admin.view_owner') : 'Переглянути користувача'}
                            >
                              <span className="text-slate-800 font-semibold group-hover/owner:text-indigo-600 transition">{item.ownerName}</span>
                              <span className="text-slate-400 text-[11px] font-medium group-hover/owner:text-indigo-500 transition">{item.ownerEmail}</span>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            {item.botName && item.botName !== '—' && item.botName !== 'Unassigned Bot' ? (
                              <div className="flex items-center justify-center space-x-1.5 text-slate-700 font-semibold">
                                <span>{item.botName}</span>
                              </div>
                            ) : (
                              <span className="text-slate-400 font-bold text-sm">—</span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-800">
                            {item.triggerCount}
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center">
                              {item.errorCount > 0 ? (
                                <span className="inline-flex items-center space-x-1 text-red-600 font-bold bg-red-50 border border-red-200 px-2.5 py-1 rounded-full text-[10px]">
                                  <span>{item.errorCount} errors</span>
                                </span>
                              ) : (
                                <span className="text-slate-400 font-mono font-bold text-[11px]">0</span>
                              )}
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center">
                              {item.blocked ? (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-rose-50 text-rose-700 border border-rose-200">
                                  {t('admin.status_blocked') !== 'admin.status_blocked' ? t('admin.status_blocked') : 'Blocked'}
                                </span>
                              ) : item.active ? (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  {t('admin.status_active') !== 'admin.status_active' ? t('admin.status_active') : 'Active'}
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-500 border border-slate-200">
                                  {t('admin.status_paused') !== 'admin.status_paused' ? t('admin.status_paused') : 'Paused'}
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3.5 bg-slate-50/70 border-t border-slate-200 text-xs text-slate-500 font-medium">
                  <div>
                    {t('admin.showing') !== 'admin.showing' ? t('admin.showing') : 'Показано'}{' '}
                    <span className="font-bold text-slate-900">{automations.length}</span>{' '}
                    {t('admin.of') !== 'admin.of' ? t('admin.of') : 'з'}{' '}
                    <span className="font-bold text-slate-900">{totalElements}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
                      disabled={page === 0}
                      className="flex items-center space-x-1 px-3 py-1 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold disabled:opacity-40 disabled:cursor-not-allowed transition shadow-2xs cursor-pointer"
                    >
                      <ChevronLeft size={14} />
                      <span>{t('admin.prev') !== 'admin.prev' ? t('admin.prev') : 'Назад'}</span>
                    </button>

                    <div className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-bold font-mono text-slate-800 shadow-2xs">
                      <span className="text-indigo-600">{page + 1}</span>
                      <span className="text-slate-400">/</span>
                      <span>{totalPages}</span>
                    </div>

                    <button
                      onClick={() => setPage((prev) => Math.min(prev + 1, totalPages - 1))}
                      disabled={page >= totalPages - 1}
                      className="flex items-center space-x-1 px-3 py-1 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold disabled:opacity-40 disabled:cursor-not-allowed transition shadow-2xs cursor-pointer"
                    >
                      <span>{t('admin.next') !== 'admin.next' ? t('admin.next') : 'Далі'}</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </main>

        {showDetailModal && selectedDetailAutomation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 animate-in fade-in duration-150">
            <div className="bg-white border border-slate-300 rounded-2xl w-full max-w-4xl h-[710px] p-6 sm:p-7 shadow-2xl flex flex-col justify-between space-y-4 overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3.5 shrink-0">
                <div className="flex items-center space-x-3.5">
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center font-bold text-indigo-600 text-lg shadow-xs">
                    <Workflow size={24} />
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-base font-bold text-slate-900 leading-tight">{selectedDetailAutomation.name}</h3>
                      <span className="px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 font-mono font-bold text-[10px]">
                        Trigger: {selectedDetailAutomation.triggerType}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${
                        selectedDetailAutomation.blocked || automationDetailData?.blocked
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : selectedDetailAutomation.active
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-100 text-slate-500 border-slate-200'
                      }`}>
                        {selectedDetailAutomation.blocked || automationDetailData?.blocked
                          ? (t('admin.status_blocked') !== 'admin.status_blocked' ? t('admin.status_blocked') : 'Blocked')
                          : selectedDetailAutomation.active
                          ? (t('admin.status_active') !== 'admin.status_active' ? t('admin.status_active') : 'Active')
                          : (t('admin.status_paused') !== 'admin.status_paused' ? t('admin.status_paused') : 'Paused')}
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 font-mono flex items-center space-x-3">
                      {selectedDetailAutomation.botName && selectedDetailAutomation.botName !== '—' && selectedDetailAutomation.botName !== 'Unassigned Bot' ? (
                        <span className="flex items-center gap-1">{selectedDetailAutomation.botName}</span>
                      ) : (
                        <span className="text-slate-400 font-semibold">—</span>
                      )}
                      <span className="text-slate-300">•</span>
                      <span>
                        Owner:{' '}
                        <strong
                          onClick={() => {
                            setShowDetailModal(false);
                            navigate(`${ROUTES.ADMIN_USERS}?search=${encodeURIComponent(selectedDetailAutomation.ownerEmail)}`);
                          }}
                          className="text-slate-800 font-semibold hover:text-indigo-600 hover:underline cursor-pointer transition"
                          title={t('admin.view_owner') !== 'admin.view_owner' ? t('admin.view_owner') : 'Переглянути користувача'}
                        >
                          {selectedDetailAutomation.ownerName}
                        </strong>{' '}
                        ({selectedDetailAutomation.ownerEmail})
                      </span>
                      <span className="text-slate-300">•</span>
                      <span>ID: #{selectedDetailAutomation.id}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {isAdmin && (
                    <>
                      <button
                        disabled={selectedDetailAutomation.blocked || automationDetailData?.blocked}
                        onClick={() => {
                          toggleMutation.mutate(selectedDetailAutomation.id);
                          setSelectedDetailAutomation((prev: any) => prev ? { ...prev, active: !prev.active } : null);
                        }}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition ${
                          selectedDetailAutomation.blocked || automationDetailData?.blocked
                            ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400 border-slate-200'
                            : selectedDetailAutomation.active
                            ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 cursor-pointer'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 cursor-pointer'
                        }`}
                      >
                        {selectedDetailAutomation.active ? <Pause size={14} /> : <Play size={14} />}
                      </button>

                      {selectedDetailAutomation.blocked || automationDetailData?.blocked ? (
                        <button
                          onClick={() => {
                            unblockMutation.mutate(selectedDetailAutomation.id);
                            setSelectedDetailAutomation((prev: any) => prev ? { ...prev, blocked: false } : null);
                          }}
                          className="px-3 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold transition cursor-pointer flex items-center space-x-1.5"
                        >
                          <Unlock size={14} />
                          <span>Розблокувати</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedBlockAutomation(selectedDetailAutomation);
                            setBlockReasonOption('SUSPICIOUS');
                            setCustomBlockReason('');
                            setShowBlockModal(true);
                          }}
                          className="px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold transition cursor-pointer flex items-center space-x-1.5"
                        >
                          <Lock size={14} />
                          <span>Заблокувати</span>
                        </button>
                      )}
                    </>
                  )}

                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="text-slate-400 hover:text-slate-700 p-1.5 hover:bg-slate-100 rounded-lg transition cursor-pointer ml-1"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {(selectedDetailAutomation.blocked || automationDetailData?.blocked) && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-2.5 text-xs text-rose-800 shrink-0 flex items-center space-x-2">
                  <ShieldAlert size={16} className="text-rose-600 shrink-0" />
                  <div>
                    <span className="font-bold">{t('admin.blocked_by_admin')}</span> {automationDetailData?.blockReason || selectedDetailAutomation.blockReason || t('admin.block_reason_rules')}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                    <Workflow size={18} />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-slate-400 uppercase">{t('admin.nodes_col')}</div>
                    <div className="text-base font-black text-slate-900 font-mono">
                      {isDetailLoading ? '...' : (automationDetailData?.nodesCount || 0)}
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <Layers size={18} />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-slate-400 uppercase">{t('admin.integrations_col')}</div>
                    <div className="text-base font-black text-slate-900 font-mono">
                      {isDetailLoading ? '...' : (automationDetailData?.integrationsCount || 0)}
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <Zap size={18} />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-slate-400 uppercase">{t('admin.executions_col')}</div>
                    <div className="text-base font-black text-slate-900 font-mono">
                      {isDetailLoading ? '...' : (automationDetailData?.triggerCount || selectedDetailAutomation.triggerCount || 0)}
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                    <AlertTriangle size={18} />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-slate-400 uppercase">{t('admin.errors_col')}</div>
                    <div className="text-base font-black text-slate-900 font-mono">
                      {isDetailLoading ? '...' : (automationDetailData?.errorCount || 0)}
                    </div>
                  </div>
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
              </div>

              <div className="flex-1 overflow-y-auto min-h-0 border border-slate-200 rounded-xl bg-slate-50/50 p-3 space-y-2 custom-scrollbar">
                <div className="flex items-center justify-between pb-1 border-b border-slate-200 text-xs font-bold text-slate-700">
                  <div className="flex items-center gap-1.5">
                    <Clock size={14} className="text-indigo-600" />
                    <span>{t('admin.activity_history')}</span>
                  </div>
                  {automationDetailData?.activities && (
                    <span className="text-[11px] font-mono text-slate-500 font-normal">
                      {t('admin.total_records')} {automationDetailData.activities.totalElements}
                    </span>
                  )}
                </div>

                {isDetailLoading ? (
                  <div className="flex items-center justify-center py-10 text-slate-400">
                    <Loader2 size={24} className="animate-spin text-indigo-600 mr-2" />
                    <span className="text-xs font-medium">{t('admin.loading_history')}</span>
                  </div>
                ) : !automationDetailData?.activities?.content?.length ? (
                  <div className="text-center py-10 text-xs text-slate-400 font-medium">
                    {t('admin.no_records')}
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {automationDetailData.activities.content.map((act) => (
                      <div key={act.id} className="bg-white border border-slate-200 rounded-lg p-2.5 flex items-start justify-between text-xs hover:border-slate-300 transition">
                        <div className="space-y-0.5">
                          <div className="font-bold text-slate-900 flex items-center space-x-2">
                            <span>{translateAuditTitle(act.title)}</span>
                            {act.badge && (
                              <span className="px-1.5 py-0.2 rounded bg-slate-100 border border-slate-200 text-slate-600 font-mono text-[9px] uppercase font-bold">
                                {act.badge}
                              </span>
                            )}
                          </div>
                          <div className="text-slate-600 text-[11px]">{translateAuditDescription(act.description)}</div>
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono shrink-0 ml-3">
                          {formatEuroDateTime(act.timestamp)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-slate-200 shrink-0">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setActivityPage((prev) => Math.max(0, prev - 1))}
                    disabled={activityPage === 0 || isDetailLoading}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-bold hover:bg-slate-100 disabled:opacity-40 cursor-pointer flex items-center gap-1"
                  >
                    <ChevronLeft size={14} />
                    <span>{t('admin.prev')}</span>
                  </button>

                  <span className="text-xs text-slate-600 font-mono font-bold px-1">
                    {t('admin.page_x_of_y', { current: activityPage + 1, total: automationDetailData?.activities?.totalPages || 1 })}
                  </span>

                  <button
                    onClick={() => setActivityPage((prev) => prev + 1)}
                    disabled={!automationDetailData?.activities || activityPage + 1 >= automationDetailData.activities.totalPages || isDetailLoading}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-bold hover:bg-slate-100 disabled:opacity-40 cursor-pointer flex items-center gap-1"
                  >
                    <span>{t('admin.next')}</span>
                    <ChevronRight size={14} />
                  </button>
                </div>

                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 cursor-pointer transition shadow-xs"
                >
                  {t('admin.close')}
                </button>
              </div>
            </div>
          </div>
        )}
        {showBlockModal && selectedBlockAutomation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 animate-in fade-in duration-150">
            <div className="bg-white border border-slate-300 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 font-bold">
                    <ShieldAlert size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 leading-snug">
                      {t('admin.block_automation_title') !== 'admin.block_automation_title' ? t('admin.block_automation_title') : 'Блокування автоматизації'}
                    </h3>
                    <p className="text-xs text-slate-500 font-mono">
                      {selectedBlockAutomation.name} (#{selectedBlockAutomation.id})
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowBlockModal(false)}
                  className="text-slate-400 hover:text-slate-700 p-1.5 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-700 block">
                  {t('admin.select_block_reason')}
                </label>

                <div className="space-y-2">
                  {blockReasonsList.map((r) => (
                    <label
                      key={r.code}
                      onClick={() => setBlockReasonOption(r.code)}
                      className={`flex items-center space-x-3 p-3.5 rounded-2xl border cursor-pointer transition ${
                        blockReasonOption === r.code
                          ? 'bg-rose-50 border-rose-400 text-rose-900 font-bold shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="blockReason"
                        checked={blockReasonOption === r.code}
                        onChange={() => setBlockReasonOption(r.code)}
                        className="accent-rose-600"
                      />
                      <span className="text-xs">{t(r.key)}</span>
                    </label>
                  ))}
                </div>

                {blockReasonOption === 'OTHER' && (
                  <div className="space-y-1.5 pt-1">
                    <label className="text-xs font-bold text-slate-700 block">{t('admin.specify_block_reason')}</label>
                    <textarea
                      value={customBlockReason}
                      onChange={(e) => setCustomBlockReason(e.target.value)}
                      placeholder="..."
                      rows={3}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 focus:outline-none focus:border-rose-500 focus:bg-white transition"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  onClick={() => setShowBlockModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
                >
                  {t('admin.cancel')}
                </button>
                <button
                  onClick={handleConfirmBlockAutomation}
                  disabled={blockMutation.isPending}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:scale-98 transition shadow-sm cursor-pointer disabled:opacity-50 flex items-center space-x-1.5"
                >
                  {blockMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                  <span>{t('admin.confirm_block_automation') !== 'admin.confirm_block_automation' ? t('admin.confirm_block_automation') : 'Заблокувати автоматизацію'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminAutomationsPage;
