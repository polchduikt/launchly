import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { fetchAdminAutomationsApi, fetchAdminAutomationDetailsApi, toggleAutomationApi } from '../api/adminApi';
import { AdminLayout } from '../layouts/AdminLayout';
import { useAuthStore } from '../../../store/useAuthStore';
import { Bot, Play, Pause, Loader2, Search, ChevronDown, ChevronLeft, ChevronRight, X, Workflow, Layers, Zap, AlertTriangle, Calendar, Clock } from 'lucide-react';
import { t } from '../../../i18n';
import { ROUTES } from '../../../constants/routes';

const PAGE_SIZE = 30;

export const AdminAutomationsPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);
  const isAdmin = currentUser?.role === 'ROLE_ADMIN';

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paused'>('all');
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(0);

  const [selectedDetailAutomation, setSelectedDetailAutomation] = useState<any | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailPeriod, setDetailPeriod] = useState<'week' | 'month' | '3months' | 'all'>('all');
  const [activityPage, setActivityPage] = useState(0);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setIsStatusDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ['adminAutomations', search, statusFilter, page],
    queryFn: () => fetchAdminAutomationsApi(search, statusFilter, page, 30),
  });

  const automations = data?.content || [];
  const totalElements = data?.totalElements || 0;
  const totalPages = data?.totalPages || 1;

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
  ];

  const getStatusLabel = (val: string) => {
    const found = statusOptions.find((o) => o.value === val);
    return found ? found.label : (t('admin.all_statuses') !== 'admin.all_statuses' ? t('admin.all_statuses') : 'Всі статуси');
  };

  return (
    <AdminLayout>
      <div className="space-y-6 w-full">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between w-full">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder={t('admin.search_automations_placeholder') !== 'admin.search_automations_placeholder' ? t('admin.search_automations_placeholder') : 'Пошук назви, власника або бота...'}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-all shadow-xs"
            />
          </div>

          <div className="relative w-full sm:w-auto flex justify-end" ref={statusDropdownRef}>
            <button
              type="button"
              onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
              className="flex items-center justify-between gap-2.5 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:border-slate-300 hover:bg-slate-50 active:scale-98 transition-all shadow-xs min-w-[140px] cursor-pointer"
            >
              <span>{getStatusLabel(statusFilter)}</span>
              <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${isStatusDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isStatusDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-44 bg-white border border-slate-200 rounded-xl shadow-lg z-50 py-1 animate-in fade-in-50 slide-in-from-top-1 duration-150">
                {statusOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setStatusFilter(opt.value as any);
                      setPage(0);
                      setIsStatusDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-xs font-bold transition-colors ${
                      statusFilter === opt.value
                        ? 'bg-indigo-50 text-indigo-600'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-indigo-600" size={32} />
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-4 px-5">{t('admin.flow_schema_col')}</th>
                    <th className="py-4 px-5 text-center">{t('admin.owner_col')}</th>
                    <th className="py-4 px-5 text-center">{t('admin.target_bot_col')}</th>
                    <th className="py-4 px-5 text-center">{t('admin.executions_col')}</th>
                    <th className="py-4 px-5 text-center">{t('admin.errors_col')}</th>
                    <th className="py-4 px-5 text-center">{t('admin.status_col')}</th>
                    {isAdmin && <th className="py-4 px-5 text-right">{t('admin.actions_col')}</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {automations.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => handleOpenDetailModal(item)}
                      className="hover:bg-slate-50/80 transition cursor-pointer group"
                      title="Переглянути деталі та статистику автоматизації"
                    >
                      <td className="py-4 px-5">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition">{item.name}</span>
                          <span className="text-[10px] font-bold text-indigo-600 font-mono">Trigger: {item.triggerType}</span>
                        </div>
                      </td>

                      <td className="py-4 px-5 text-center">
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

                      <td className="py-4 px-5 text-center">
                        {item.botName && item.botName !== '—' && item.botName !== 'Unassigned Bot' ? (
                          <div className="flex items-center justify-center space-x-1.5 text-slate-700 font-semibold">
                            <Bot size={15} className="text-indigo-600" />
                            <span>{item.botName}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-bold text-sm">—</span>
                        )}
                      </td>

                      <td className="py-4 px-5 text-center font-mono font-bold text-slate-800">
                        {item.triggerCount}
                      </td>

                      <td className="py-4 px-5 text-center">
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

                      <td className="py-4 px-5 text-center">
                        <div className="flex items-center justify-center">
                          {item.active ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {t('admin.status_active') !== 'admin.status_active' ? t('admin.status_active') : 'Active'}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                              {t('admin.status_paused') !== 'admin.status_paused' ? t('admin.status_paused') : 'Paused'}
                            </span>
                          )}
                        </div>
                      </td>

                      {isAdmin && (
                        <td className="py-4 px-5 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleMutation.mutate(item.id);
                            }}
                            className={`p-2 rounded-xl border text-xs font-bold transition cursor-pointer ${
                              item.active
                                ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            }`}
                            title={item.active ? 'Pause Automation' : 'Resume Automation'}
                          >
                            {item.active ? <Pause size={14} /> : <Play size={14} />}
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>

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
          </div>
        )}

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
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                        selectedDetailAutomation.active
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-100 text-slate-500 border-slate-200'
                      }`}>
                        {selectedDetailAutomation.active ? (t('admin.status_active') !== 'admin.status_active' ? t('admin.status_active') : 'Active') : (t('admin.status_paused') !== 'admin.status_paused' ? t('admin.status_paused') : 'Paused')}
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 font-mono flex items-center space-x-3">
                      {selectedDetailAutomation.botName && selectedDetailAutomation.botName !== '—' && selectedDetailAutomation.botName !== 'Unassigned Bot' ? (
                        <span className="flex items-center gap-1"><Bot size={13} className="text-indigo-600" /> {selectedDetailAutomation.botName}</span>
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
                    <button
                      onClick={() => {
                        toggleMutation.mutate(selectedDetailAutomation.id);
                        setSelectedDetailAutomation((prev: any) => prev ? { ...prev, active: !prev.active } : null);
                      }}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 ${
                        selectedDetailAutomation.active
                          ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                      }`}
                    >
                      {selectedDetailAutomation.active ? <Pause size={14} /> : <Play size={14} />}
                      <span>{selectedDetailAutomation.active ? (t('admin.pause_button') !== 'admin.pause_button' ? t('admin.pause_button') : 'Зупинити') : (t('admin.resume_button') !== 'admin.resume_button' ? t('admin.resume_button') : 'Запустити')}</span>
                    </button>
                  )}

                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="text-slate-400 hover:text-slate-700 p-1.5 hover:bg-slate-100 rounded-lg transition cursor-pointer ml-1"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

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
      </div>
    </AdminLayout>
  );
};

export default AdminAutomationsPage;
