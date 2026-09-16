import React, { useState, useEffect } from 'react';
import { formatAuditTitle, formatAuditDescription } from '../../../utils/auditFormatters';
import { formatEuroDateTime } from '../../../utils/date';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { fetchAdminAutomationsApi, fetchAdminAutomationDetailsApi, toggleAutomationApi, blockAutomationApi, unblockAutomationApi } from '../../../api/admin';
import type { AdminAutomationItem } from '../../../api/admin';
import { queryKeys } from '../../../api/queryKeys';
import { AdminLayout } from '../../../components/layout/AdminLayout';
import { useAuthStore } from '../../../store/useAuthStore';
import { Play, Pause, Loader2, Workflow, Layers, Zap, AlertTriangle, Calendar, Clock, ShieldAlert, Lock, Unlock, Filter, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from '../../../i18n/config';
import { ROUTES } from '../../../routes/paths';
import {
  AdminSearchBar,
  AdminPagination,
  AdminFilterDropdown,
  AdminBulkActions,
  AdminBlockModal,
} from '../../../components/admin';
import { useAdminSearch } from '../../../hooks/admin/useAdminSearch';
import { useAdminSelection } from '../../../hooks/admin/useAdminSelection';

export const AdminAutomationsPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);
  const isAdmin = currentUser?.role === 'ROLE_ADMIN';

  const { search, setSearch, debouncedSearch, page, setPage } = useAdminSearch({ initialSearch });
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortFilter, setSortFilter] = useState<'desc' | 'asc'>('desc');

  const [showBlockModal, setShowBlockModal] = useState(false);
  const [selectedBlockAutomation, setSelectedBlockAutomation] = useState<AdminAutomationItem | null>(null);

  useEffect(() => {
    const param = searchParams.get('search');
    if (param !== null) {
      setSearch(param);
    }
  }, [searchParams, setSearch]);

  const [selectedDetailAutomation, setSelectedDetailAutomation] = useState<AdminAutomationItem | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailPeriod, setDetailPeriod] = useState<'week' | 'month' | '3months' | 'all'>('all');
  const [activityPage, setActivityPage] = useState(0);

  const automationsQueryKey = [...queryKeys.admin.automations, debouncedSearch, statusFilter, sortFilter, page] as const;

  const { data, isLoading } = useQuery({
    queryKey: automationsQueryKey,
    queryFn: () => fetchAdminAutomationsApi(debouncedSearch, statusFilter, sortFilter, page, 30),
  });

  const automations = data?.content || [];
  const totalElements = data?.totalElements || 0;
  const totalPages = data?.totalPages || 1;

  const {
    selectedIds,
    isAllSelected,
    toggleSelectAll: handleToggleSelectAll,
    toggleSelect: handleToggleSelectRow,
    clearSelection,
  } = useAdminSelection(automations);

  const handleBulkPause = () => {
    const targets = automations.filter((a: AdminAutomationItem) => selectedIds.includes(a.id) && !a.blocked && a.active);
    targets.forEach((a: AdminAutomationItem) => toggleMutation.mutate(a.id));
    clearSelection();
  };

  const handleBulkResume = () => {
    const targets = automations.filter((a: AdminAutomationItem) => selectedIds.includes(a.id) && !a.blocked && !a.active);
    targets.forEach((a: AdminAutomationItem) => toggleMutation.mutate(a.id));
    clearSelection();
  };

  const handleBulkBlock = () => {
    const targets = automations.filter((a: AdminAutomationItem) => selectedIds.includes(a.id) && !a.blocked);
    targets.forEach((a: AdminAutomationItem) => blockMutation.mutate({ id: a.id, reason: 'Bulk admin action' }));
    clearSelection();
  };

  const handleBulkUnblock = () => {
    const targets = automations.filter((a: AdminAutomationItem) => selectedIds.includes(a.id) && a.blocked);
    targets.forEach((a: AdminAutomationItem) => unblockMutation.mutate(a.id));
    clearSelection();
  };

  const { data: automationDetailData, isLoading: isDetailLoading } = useQuery({
    queryKey: [...queryKeys.admin.automationDetails(selectedDetailAutomation?.id), detailPeriod, activityPage],
    queryFn: () => fetchAdminAutomationDetailsApi(selectedDetailAutomation!.id, detailPeriod, activityPage, 20),
    enabled: !!selectedDetailAutomation && showDetailModal
  });

  const handleOpenDetailModal = (item: AdminAutomationItem) => {
    setSelectedDetailAutomation(item);
    setActivityPage(0);
    setShowDetailModal(true);
  };

  const toggleMutation = useMutation({
    mutationFn: (id: number) => toggleAutomationApi(id),
    onMutate: async (id: number) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.admin.automations });
      const previousData = queryClient.getQueryData<{ content?: AdminAutomationItem[] }>(automationsQueryKey);
      queryClient.setQueryData<{ content?: AdminAutomationItem[] }>(automationsQueryKey, (old) => {
        if (!old?.content) return old;
        return {
          ...old,
          content: old.content.map((item: AdminAutomationItem) =>
            item.id === id ? { ...item, active: !item.active } : item
          ),
        };
      });
      return { previousData };
    },
    onError: (_err, _id, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(automationsQueryKey, context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.automations });
    },
  });

  const blockMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => blockAutomationApi(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.automations });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.automationDetails() });
      setShowBlockModal(false);
      setSelectedBlockAutomation(null);
    },
  });

  const unblockMutation = useMutation({
    mutationFn: (id: number) => unblockAutomationApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.automations });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.automationDetails() });
    },
  });

  const translateAuditTitle = (title: string, targetName?: string) => formatAuditTitle(title, targetName, t);
  const translateAuditDescription = (desc: string) => formatAuditDescription(desc, t);

  const statusOptions = [
    { value: 'all', label: t('admin.all_statuses') !== 'admin.all_statuses' ? t('admin.all_statuses') : 'Всі статуси' },
    { value: 'active', label: t('admin.status_active') !== 'admin.status_active' ? t('admin.status_active') : 'Активні' },
    { value: 'paused', label: t('admin.status_paused') !== 'admin.status_paused' ? t('admin.status_paused') : 'На паузі' },
    { value: 'blocked', label: t('admin.status_blocked') !== 'admin.status_blocked' ? t('admin.status_blocked') : 'Заблоковані' },
  ];

  return (
    <AdminLayout noPadding={true}>
      <div className="flex h-full w-full overflow-hidden bg-[#F2EBDD] text-[#0A0A0A] font-['JetBrains_Mono',monospace]">
        
        <aside className="w-56 lg:w-60 bg-[#F2EBDD] border-r-2 border-[#0A0A0A] h-full p-4 space-y-5 overflow-y-auto shrink-0 flex flex-col justify-between z-10">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b-2 border-[#0A0A0A]">
              <h3 className="font-['Anybody',sans-serif] text-xs font-black uppercase text-[#0A0A0A] flex items-center gap-1.5">
                <Filter size={14} className="text-[#0A0A0A]" />
                <span>{t('admin.filters_title')}</span>
              </h3>
              {(statusFilter !== 'all' || sortFilter !== 'desc') && (
                <button
                  onClick={() => {
                    setStatusFilter('all');
                    setSortFilter('desc');
                    setPage(0);
                  }}
                  className="text-[10px] font-black uppercase text-[#0A0A0A] underline hover:opacity-80 transition cursor-pointer"
                >
                  {t('admin.reset_filters')}
                </button>
              )}
            </div>

            <AdminFilterDropdown
              label={t('admin.status_filter_label')}
              value={statusFilter}
              options={statusOptions}
              onChange={(val) => {
                setStatusFilter(val);
                setPage(0);
              }}
            />

            <AdminFilterDropdown
              label={t('admin.sorting_label')}
              value={sortFilter}
              options={[
                { value: 'desc', label: t('admin.sort_newest') },
                { value: 'asc', label: t('admin.sort_oldest') },
              ]}
              onChange={(val) => {
                setSortFilter(val as 'desc' | 'asc');
                setPage(0);
              }}
            />
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto p-6 lg:p-8 min-w-0 h-full bg-[#F2EBDD] space-y-4">
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3 flex-1 max-w-md">
              <AdminSearchBar
                placeholder={t('admin.search_automations_placeholder') !== 'admin.search_automations_placeholder' ? t('admin.search_automations_placeholder') : 'Пошук назви, власника або бота...'}
                value={search}
                onChange={setSearch}
              />
              {selectedIds.length > 0 && (
                <span className="px-3.5 py-1.5 rounded-xl bg-white border-2 border-[#0A0A0A] text-[#0A0A0A] font-black text-xs shrink-0 shadow-[2px_2px_0px_#0A0A0A]">
                  {t('admin.selected_count', { count: selectedIds.length })}
                </span>
              )}
            </div>

            <AdminBulkActions
              selectedCount={selectedIds.length}
              actions={[
                { label: t('admin.bulk_pause'), onClick: handleBulkPause, icon: <Pause size={14} className="text-[#0A0A0A]" /> },
                { label: t('admin.bulk_resume'), onClick: handleBulkResume, icon: <Play size={14} className="text-[#0A0A0A]" /> },
                ...(isAdmin ? [
                  { label: t('admin.bulk_block'), onClick: handleBulkBlock, icon: <Lock size={14} />, variant: 'danger' as const },
                  { label: t('admin.bulk_unblock'), onClick: handleBulkUnblock, icon: <Unlock size={14} /> },
                ] : []),
              ]}
            />
          </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20 bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-3xl shadow-[4px_4px_0px_#0A0A0A]">
            <Loader2 className="animate-spin text-[#0A0A0A]" size={32} />
          </div>
        ) : (
          <>
            <div className="bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-3xl overflow-hidden shadow-[4px_4px_0px_#0A0A0A]">
              <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-['JetBrains_Mono',monospace]">
                    <thead className="bg-[#F2EBDD] border-b-2 border-[#0A0A0A] text-[#0A0A0A] font-black uppercase text-[10px]">
                      <tr>
                        <th className="py-3.5 px-4 text-center w-10">
                          <input
                            type="checkbox"
                            checked={isAllSelected}
                            onChange={handleToggleSelectAll}
                            className="w-4 h-4 rounded border-2 border-[#0A0A0A] text-[#0A0A0A] accent-[#0A0A0A] cursor-pointer"
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
                    <tbody className="divide-y divide-[#0A0A0A]/20">
                      {automations.map((item) => (
                        <tr
                          key={item.id}
                          onClick={() => handleOpenDetailModal(item)}
                          className={`transition cursor-pointer group ${
                            item.blocked
                              ? 'bg-rose-100/60 hover:bg-rose-100'
                              : 'hover:bg-white'
                          }`}
                          title="Переглянути деталі та статистику автоматизації"
                        >
                          <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(item.id)}
                              onChange={() => handleToggleSelectRow(item.id)}
                              className="w-4 h-4 rounded border-2 border-[#0A0A0A] text-[#0A0A0A] accent-[#0A0A0A] cursor-pointer"
                            />
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex flex-col">
                              <span className="font-black text-[#0A0A0A] group-hover:underline transition">{item.name}</span>
                              <span className="text-[10px] font-black text-[#0A0A0A] font-mono">Trigger: {item.triggerType}</span>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`${ROUTES.ADMIN_USERS}?search=${encodeURIComponent(item.ownerEmail || '')}`);
                              }}
                              className="flex flex-col items-center justify-center cursor-pointer group/owner inline-flex hover:opacity-80 transition"
                              title={t('admin.view_owner') !== 'admin.view_owner' ? t('admin.view_owner') : 'Переглянути користувача'}
                            >
                              <span className="text-[#0A0A0A] font-black group-hover/owner:underline transition">{item.ownerName}</span>
                              <span className="text-slate-700 text-[11px] font-bold transition">{item.ownerEmail}</span>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            {item.botName && item.botName !== '—' && item.botName !== 'Unassigned Bot' ? (
                              <div className="flex items-center justify-center space-x-1.5 text-[#0A0A0A] font-black">
                                <span>{item.botName}</span>
                              </div>
                            ) : (
                              <span className="text-slate-500 font-bold text-sm">—</span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-center font-mono font-black text-[#0A0A0A]">
                            {item.triggerCount}
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center">
                              {(item.errorCount || 0) > 0 ? (
                                <span className="inline-flex items-center space-x-1 text-rose-950 font-black bg-rose-200 border-2 border-[#0A0A0A] px-2.5 py-1 rounded-lg text-[10px] uppercase">
                                  <span>{item.errorCount} errors</span>
                                </span>
                              ) : (
                                <span className="text-[#0A0A0A] font-mono font-black text-[11px]">0</span>
                              )}
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center">
                              {item.blocked ? (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase bg-rose-200 text-rose-950 border-2 border-[#0A0A0A]">
                                  {t('admin.status_blocked') !== 'admin.status_blocked' ? t('admin.status_blocked') : 'Blocked'}
                                </span>
                              ) : item.active ? (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase bg-emerald-200 text-emerald-950 border-2 border-[#0A0A0A]">
                                  {t('admin.status_active') !== 'admin.status_active' ? t('admin.status_active') : 'Active'}
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase bg-white text-[#0A0A0A] border-2 border-[#0A0A0A]">
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

                <div className="px-5 py-3.5 bg-[#F2EBDD] border-t-2 border-[#0A0A0A]">
                  <AdminPagination
                    page={page}
                    totalPages={totalPages}
                    totalElements={totalElements}
                    currentCount={automations.length}
                    onPageChange={setPage}
                  />
                </div>
              </div>
            </>
          )}
        </main>

        {showDetailModal && selectedDetailAutomation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A0A0A]/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
            <div className="bg-[#F2EBDD] border-4 border-[#0A0A0A] rounded-3xl w-full max-w-4xl h-[710px] p-6 sm:p-7 shadow-[10px_10px_0px_#0A0A0A] flex flex-col justify-between space-y-4 overflow-hidden text-[#0A0A0A] font-['JetBrains_Mono',monospace]">
              <div className="flex items-center justify-between border-b-2 border-[#0A0A0A] pb-3.5 shrink-0">
                <div className="flex items-center space-x-3.5">
                  <div className="w-12 h-12 rounded-xl bg-white border-2 border-[#0A0A0A] flex items-center justify-center font-black text-[#0A0A0A] text-lg shadow-[2px_2px_0px_#0A0A0A]">
                    <Workflow size={24} />
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-['Anybody',sans-serif] text-base font-black uppercase text-[#0A0A0A] leading-tight">{selectedDetailAutomation.name}</h3>
                      <span className="px-2 py-0.5 rounded-md bg-white border border-[#0A0A0A] text-[#0A0A0A] font-mono font-black text-[10px]">
                        Trigger: {selectedDetailAutomation.triggerType}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase border-2 border-[#0A0A0A] ${
                        selectedDetailAutomation.blocked || automationDetailData?.blocked
                          ? 'bg-rose-200 text-rose-950'
                          : selectedDetailAutomation.active
                          ? 'bg-emerald-200 text-emerald-950'
                          : 'bg-white text-[#0A0A0A]'
                      }`}>
                        {selectedDetailAutomation.blocked || automationDetailData?.blocked
                          ? (t('admin.status_blocked') !== 'admin.status_blocked' ? t('admin.status_blocked') : 'Blocked')
                          : selectedDetailAutomation.active
                          ? (t('admin.status_active') !== 'admin.status_active' ? t('admin.status_active') : 'Active')
                          : (t('admin.status_paused') !== 'admin.status_paused' ? t('admin.status_paused') : 'Paused')}
                      </span>
                    </div>

                    <div className="text-xs text-slate-700 font-mono flex items-center space-x-3 font-bold">
                      {selectedDetailAutomation.botName && selectedDetailAutomation.botName !== '—' && selectedDetailAutomation.botName !== 'Unassigned Bot' ? (
                        <span className="flex items-center gap-1">{selectedDetailAutomation.botName}</span>
                      ) : (
                        <span className="text-slate-500 font-bold">—</span>
                      )}
                      <span>•</span>
                      <span>
                        Owner:{' '}
                        <strong
                          onClick={() => {
                            setShowDetailModal(false);
                            navigate(`${ROUTES.ADMIN_USERS}?search=${encodeURIComponent(selectedDetailAutomation?.ownerEmail || '')}`);
                          }}
                          className="text-[#0A0A0A] font-black hover:underline cursor-pointer transition"
                          title={t('admin.view_owner') !== 'admin.view_owner' ? t('admin.view_owner') : 'Переглянути користувача'}
                        >
                          {selectedDetailAutomation.ownerName}
                        </strong>{' '}
                        ({selectedDetailAutomation.ownerEmail})
                      </span>
                      <span>•</span>
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
                          setSelectedDetailAutomation((prev: AdminAutomationItem | null) => prev ? { ...prev, active: !prev.active } : null);
                        }}
                        className={`px-3 py-1.5 rounded-xl border-2 border-[#0A0A0A] text-xs font-black uppercase transition shadow-[2px_2px_0px_#0A0A0A] ${
                          selectedDetailAutomation.blocked || automationDetailData?.blocked
                            ? 'opacity-40 cursor-not-allowed bg-slate-200 text-slate-500'
                            : selectedDetailAutomation.active
                            ? 'bg-amber-200 text-amber-950 hover:bg-amber-300 cursor-pointer'
                            : 'bg-emerald-200 text-emerald-950 hover:bg-emerald-300 cursor-pointer'
                        }`}
                      >
                        {selectedDetailAutomation.active ? <Pause size={14} /> : <Play size={14} />}
                      </button>

                      {selectedDetailAutomation.blocked || automationDetailData?.blocked ? (
                        <button
                          onClick={() => {
                            unblockMutation.mutate(selectedDetailAutomation.id);
                            setSelectedDetailAutomation((prev: AdminAutomationItem | null) => prev ? { ...prev, blocked: false } : null);
                          }}
                          className="px-3 py-1.5 rounded-xl border-2 border-[#0A0A0A] bg-emerald-200 text-emerald-950 hover:bg-emerald-300 text-xs font-black uppercase transition cursor-pointer flex items-center space-x-1.5 shadow-[2px_2px_0px_#0A0A0A]"
                        >
                          <Unlock size={14} />
                          <span>Розблокувати</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedBlockAutomation(selectedDetailAutomation);
                            setShowBlockModal(true);
                          }}
                          className="px-3 py-1.5 rounded-xl border-2 border-[#0A0A0A] bg-rose-200 text-rose-950 hover:bg-rose-300 text-xs font-black uppercase transition cursor-pointer flex items-center space-x-1.5 shadow-[2px_2px_0px_#0A0A0A]"
                        >
                          <Lock size={14} />
                          <span>Заблокувати</span>
                        </button>
                      )}
                    </>
                  )}

                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="w-8 h-8 flex items-center justify-center rounded-xl border-2 border-[#0A0A0A] bg-white text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-white transition-all cursor-pointer shadow-sm ml-1"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {(selectedDetailAutomation.blocked || automationDetailData?.blocked) && (
                <div className="bg-rose-100 border-2 border-[#0A0A0A] rounded-xl p-2.5 text-xs text-rose-950 font-bold shrink-0 flex items-center space-x-2 shadow-[2px_2px_0px_#0A0A0A]">
                  <ShieldAlert size={16} className="text-rose-700 shrink-0" />
                  <div>
                    <span className="font-black">{t('admin.blocked_by_admin')}</span> {automationDetailData?.blockReason || selectedDetailAutomation.blockReason || t('admin.block_reason_rules')}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
                <div className="bg-white border-2 border-[#0A0A0A] rounded-xl p-3 flex items-center space-x-3 shadow-[2px_2px_0px_#0A0A0A]">
                  <div className="w-9 h-9 rounded-lg bg-[#F2EBDD] border border-[#0A0A0A] text-[#0A0A0A] flex items-center justify-center shrink-0">
                    <Workflow size={18} />
                  </div>
                  <div>
                    <div className="text-[11px] font-black text-slate-700 uppercase">{t('admin.nodes_col')}</div>
                    <div className="text-base font-black text-[#0A0A0A] font-mono">
                      {isDetailLoading ? '...' : (automationDetailData?.nodesCount || 0)}
                    </div>
                  </div>
                </div>

                <div className="bg-white border-2 border-[#0A0A0A] rounded-xl p-3 flex items-center space-x-3 shadow-[2px_2px_0px_#0A0A0A]">
                  <div className="w-9 h-9 rounded-lg bg-[#F2EBDD] border border-[#0A0A0A] text-[#0A0A0A] flex items-center justify-center shrink-0">
                    <Layers size={18} />
                  </div>
                  <div>
                    <div className="text-[11px] font-black text-slate-700 uppercase">{t('admin.integrations_col')}</div>
                    <div className="text-base font-black text-[#0A0A0A] font-mono">
                      {isDetailLoading ? '...' : (automationDetailData?.integrationsCount || 0)}
                    </div>
                  </div>
                </div>

                <div className="bg-white border-2 border-[#0A0A0A] rounded-xl p-3 flex items-center space-x-3 shadow-[2px_2px_0px_#0A0A0A]">
                  <div className="w-9 h-9 rounded-lg bg-[#F2EBDD] border border-[#0A0A0A] text-[#0A0A0A] flex items-center justify-center shrink-0">
                    <Zap size={18} />
                  </div>
                  <div>
                    <div className="text-[11px] font-black text-slate-700 uppercase">{t('admin.executions_col')}</div>
                    <div className="text-base font-black text-[#0A0A0A] font-mono">
                      {isDetailLoading ? '...' : (automationDetailData?.triggerCount || selectedDetailAutomation.triggerCount || 0)}
                    </div>
                  </div>
                </div>

                <div className="bg-white border-2 border-[#0A0A0A] rounded-xl p-3 flex items-center space-x-3 shadow-[2px_2px_0px_#0A0A0A]">
                  <div className="w-9 h-9 rounded-lg bg-[#F2EBDD] border border-[#0A0A0A] text-[#0A0A0A] flex items-center justify-center shrink-0">
                    <AlertTriangle size={18} />
                  </div>
                  <div>
                    <div className="text-[11px] font-black text-slate-700 uppercase">{t('admin.errors_col')}</div>
                    <div className="text-base font-black text-[#0A0A0A] font-mono">
                      {isDetailLoading ? '...' : (automationDetailData?.errorCount || 0)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 bg-white p-2.5 rounded-xl border-2 border-[#0A0A0A] shrink-0 shadow-[2px_2px_0px_#0A0A0A]">
                <div className="flex items-center space-x-1">
                  <span className="text-[11px] font-black text-[#0A0A0A] uppercase mr-1 flex items-center gap-1">
                    <Calendar size={13} />
                    {t('admin.period_label')}
                  </span>
                  {(
                    [
                      { id: 'week', label: t('admin.7_days') },
                      { id: 'month', label: t('admin.30_days') },
                      { id: '3months', label: t('admin.90_days') },
                      { id: 'all', label: t('admin.all_time') }
                    ] as const
                  ).map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setDetailPeriod(p.id);
                        setActivityPage(0);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase transition cursor-pointer ${
                        detailPeriod === p.id
                          ? 'bg-[#0A0A0A] text-[#F2EBDD]'
                          : 'text-[#0A0A0A] hover:bg-[#F2EBDD]'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto min-h-0 border-2 border-[#0A0A0A] rounded-xl bg-white p-3 space-y-2 custom-scrollbar shadow-[2px_2px_0px_#0A0A0A]">
                <div className="flex items-center justify-between pb-1 border-b-2 border-[#0A0A0A] text-xs font-black uppercase text-[#0A0A0A]">
                  <div className="flex items-center gap-1.5">
                    <Clock size={14} className="text-[#0A0A0A]" />
                    <span>{t('admin.activity_history')}</span>
                  </div>
                  {automationDetailData?.activities && (
                    <span className="text-[11px] font-mono text-[#0A0A0A] font-bold">
                      {t('admin.total_records')} {automationDetailData.activities.totalElements}
                    </span>
                  )}
                </div>

                {isDetailLoading ? (
                  <div className="flex items-center justify-center py-10 text-slate-700 font-bold">
                    <Loader2 size={24} className="animate-spin text-[#0A0A0A] mr-2" />
                    <span className="text-xs font-bold">{t('admin.loading_history')}</span>
                  </div>
                ) : !automationDetailData?.activities?.content?.length ? (
                  <div className="text-center py-10 text-xs text-slate-700 font-bold">
                    {t('admin.no_records')}
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {automationDetailData.activities.content.map((act) => (
                      <div key={act.id} className="bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-lg p-2.5 flex items-start justify-between text-xs transition">
                        <div className="space-y-0.5">
                          <div className="font-black text-[#0A0A0A] flex items-center space-x-2">
                            <span>{translateAuditTitle(act.title, act.targetName || automationDetailData?.name)}</span>
                            {act.badge && (
                              <span className="px-1.5 py-0.2 rounded bg-white border border-[#0A0A0A] text-[#0A0A0A] font-mono text-[9px] uppercase font-black">
                                {act.badge}
                              </span>
                            )}
                          </div>
                          <div className="text-slate-800 text-[11px] font-bold">{translateAuditDescription(act.description)}</div>
                        </div>
                        <div className="text-[11px] text-slate-700 font-mono font-bold shrink-0 ml-3">
                          {formatEuroDateTime(act.timestamp)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between pt-3 border-t-2 border-[#0A0A0A] shrink-0">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setActivityPage((prev) => Math.max(0, prev - 1))}
                    disabled={activityPage === 0 || isDetailLoading}
                    className="px-2.5 py-1 rounded-lg border-2 border-[#0A0A0A] bg-white text-[#0A0A0A] text-xs font-black uppercase hover:bg-[#0A0A0A] hover:text-[#F2EBDD] disabled:opacity-40 cursor-pointer flex items-center gap-1"
                  >
                    <ChevronLeft size={14} />
                    <span>{t('admin.prev')}</span>
                  </button>

                  <span className="text-xs text-[#0A0A0A] font-mono font-black px-1">
                    {t('admin.page_x_of_y', { current: activityPage + 1, total: automationDetailData?.activities?.totalPages || 1 })}
                  </span>

                  <button
                    onClick={() => setActivityPage((prev) => prev + 1)}
                    disabled={!automationDetailData?.activities || activityPage + 1 >= automationDetailData.activities.totalPages || isDetailLoading}
                    className="px-2.5 py-1 rounded-lg border-2 border-[#0A0A0A] bg-white text-[#0A0A0A] text-xs font-black uppercase hover:bg-[#0A0A0A] hover:text-[#F2EBDD] disabled:opacity-40 cursor-pointer flex items-center gap-1"
                  >
                    <span>{t('admin.next')}</span>
                    <ChevronRight size={14} />
                  </button>
                </div>

                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-4 py-1.5 rounded-lg text-xs font-black uppercase text-[#F2EBDD] bg-[#0A0A0A] border-2 border-[#0A0A0A] hover:bg-[#2A2A2A] cursor-pointer transition shadow-[2px_2px_0px_#0A0A0A]"
                >
                  {t('admin.close')}
                </button>
              </div>
            </div>
          </div>
        )}
        <AdminBlockModal
          isOpen={showBlockModal && Boolean(selectedBlockAutomation)}
          onClose={() => setShowBlockModal(false)}
          onConfirm={(reasonCode, details) => {
            if (!selectedBlockAutomation) return;
            const reasonMap: Record<string, string> = {
              SUSPICIOUS: 'Suspicious activity',
              RULES: 'Violation of platform rules',
              SPAM: 'Spam or unauthorized bulk messaging',
              OTHER: details?.trim() || 'Other reason',
            };
            const finalReason = reasonMap[reasonCode] || details || reasonCode;
            blockMutation.mutate({ id: selectedBlockAutomation.id, reason: finalReason });
          }}
          title={t('admin.block_automation_title') !== 'admin.block_automation_title' ? t('admin.block_automation_title') : 'Блокування автоматизації'}
          entityInfo={selectedBlockAutomation && (
            <div className="bg-white p-3.5 rounded-2xl border-2 border-[#0A0A0A] text-xs text-[#0A0A0A] space-y-1">
              <div>Name: <strong className="text-[#0A0A0A] font-black">{selectedBlockAutomation.name}</strong></div>
              <div className="text-slate-700 font-bold">ID: #{selectedBlockAutomation.id}</div>
            </div>
          )}
          reasons={[
            { code: 'SUSPICIOUS', label: t('admin.reason_suspicious') !== 'admin.reason_suspicious' ? t('admin.reason_suspicious') : 'Підозріла активність' },
            { code: 'RULES', label: t('admin.reason_rules') !== 'admin.reason_rules' ? t('admin.reason_rules') : 'Порушення правил' },
            { code: 'SPAM', label: t('admin.reason_spam') !== 'admin.reason_spam' ? t('admin.reason_spam') : 'Спам / зловживання' },
            { code: 'OTHER', label: t('admin.reason_other') !== 'admin.reason_other' ? t('admin.reason_other') : 'Інше' },
          ]}
          isPending={blockMutation.isPending}
        />
      </div>
    </AdminLayout>
  );
};

export default AdminAutomationsPage;
