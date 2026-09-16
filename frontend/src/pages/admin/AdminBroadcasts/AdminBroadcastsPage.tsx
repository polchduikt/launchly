import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  fetchAdminBroadcastsApi,
  fetchAdminBroadcastDetailsApi,
  cancelAdminBroadcastApi,
  blockAdminBroadcastApi,
  unblockAdminBroadcastApi,
} from '../../../api/admin';
import type { AdminBroadcast, AdminBroadcastItem } from '../../../api/admin';
import { queryKeys } from '../../../api/queryKeys';
import { AdminLayout } from '../../../components/layout/AdminLayout';
import {
  Users,
  CheckCircle2,
  Loader2,
  X,
  ChevronRight,
  ChevronLeft,
  Clock,
  Send,
  AlertCircle,
  Lock,
  Unlock,
  Ban,
  Filter
} from 'lucide-react';
import { useTranslation } from '../../../i18n/config';
import { useAuthStore } from '../../../store/useAuthStore';
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
import { formatEuroDateTime } from '../../../utils/date';

export const AdminBroadcastsPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user);
  const isAdmin = currentUser?.role === 'ROLE_ADMIN';
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const { search: searchQuery, setSearch: setSearchQuery, debouncedSearch, page, setPage } = useAdminSearch({
    initialSearch: searchParams.get('search') || '',
  });
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get('status') || 'all');
  const [sortFilter, setSortFilter] = useState<'desc' | 'asc'>('desc');
  const size = 30;

  const [selectedBroadcast, setSelectedBroadcast] = useState<AdminBroadcast | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | 'all'>('all');
  const [detailsPage, setDetailsPage] = useState(0);

  const [showBlockModal, setShowBlockModal] = useState(false);
  const [selectedBlockBroadcast, setSelectedBlockBroadcast] = useState<AdminBroadcast | null>(null);

  useEffect(() => {
    const params: Record<string, string> = {};
    if (debouncedSearch) params.search = debouncedSearch;
    if (statusFilter !== 'all') params.status = statusFilter;
    setSearchParams(params, { replace: true });
  }, [debouncedSearch, statusFilter, setSearchParams]);

  const broadcastsQueryKey = [...queryKeys.admin.broadcasts, debouncedSearch, statusFilter, sortFilter, page, size] as const;

  const { data, isLoading } = useQuery({
    queryKey: broadcastsQueryKey,
    queryFn: () => fetchAdminBroadcastsApi(debouncedSearch, statusFilter, sortFilter, page, size),
    refetchInterval: (query) => {
      const content = (query.state.data as { content?: AdminBroadcastItem[] } | undefined)?.content;
      if (!content) return false;
      const hasActive = content.some(
        (b: AdminBroadcastItem) => b.status === 'IN_PROGRESS' || b.status === 'SCHEDULED'
      );
      return hasActive ? 2000 : false;
    },
  });

  const broadcasts = data?.content || [];
  const totalElements = data?.totalElements || 0;
  const totalPages = Math.max(data?.totalPages || 1, 1);

  const {
    selectedIds,
    isAllSelected,
    toggleSelectAll: handleToggleSelectAll,
    toggleSelect: handleToggleSelectRow,
    clearSelection,
  } = useAdminSelection(broadcasts);

  const handleBulkCancel = () => {
    const targets = broadcasts.filter(
      (b: AdminBroadcastItem) => selectedIds.includes(b.id) && !b.isBlocked && b.status !== 'BLOCKED' && b.status !== 'COMPLETED' && b.status !== 'CANCELLED'
    );
    targets.forEach((b: AdminBroadcastItem) => cancelMutation.mutate(b.id));
    clearSelection();
  };

  const handleBulkBlock = () => {
    const targets = broadcasts.filter((b: AdminBroadcastItem) => selectedIds.includes(b.id) && !b.isBlocked && b.status !== 'BLOCKED');
    targets.forEach((b: AdminBroadcastItem) => blockMutation.mutate({ broadcastId: b.id, reason: 'Bulk admin action' }));
    clearSelection();
  };

  const handleBulkUnblock = () => {
    const targets = broadcasts.filter((b: AdminBroadcastItem) => selectedIds.includes(b.id) && (b.isBlocked || b.status === 'BLOCKED'));
    targets.forEach((b: AdminBroadcastItem) => unblockMutation.mutate(b.id));
    clearSelection();
  };

  const { data: detailsData, isLoading: isDetailsLoading } = useQuery({
    queryKey: [...queryKeys.admin.broadcastDetails(selectedBroadcast?.id), selectedPeriod, detailsPage],
    queryFn: () => fetchAdminBroadcastDetailsApi(selectedBroadcast!.id, selectedPeriod, detailsPage, 10),
    enabled: !!selectedBroadcast && showDetailModal,
  });

  const cancelMutation = useMutation({
    mutationFn: (broadcastId: number) => cancelAdminBroadcastApi(broadcastId),
    onMutate: async (broadcastId: number) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.admin.broadcasts });
      const previousData = queryClient.getQueryData<{ content?: AdminBroadcastItem[] }>(broadcastsQueryKey);
      queryClient.setQueryData<{ content?: AdminBroadcastItem[] }>(broadcastsQueryKey, (old) => {
        if (!old?.content) return old;
        return {
          ...old,
          content: old.content.map((b: AdminBroadcastItem) =>
            b.id === broadcastId ? { ...b, status: 'CANCELLED' } : b
          ),
        };
      });
      return { previousData };
    },
    onError: (_err, _id, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(broadcastsQueryKey, context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.broadcasts });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.broadcastDetails() });
    },
  });

  const blockMutation = useMutation({
    mutationFn: ({ broadcastId, reason }: { broadcastId: number; reason: string }) =>
      blockAdminBroadcastApi(broadcastId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.broadcasts });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.broadcastDetails() });
      setShowBlockModal(false);
    },
  });

  const unblockMutation = useMutation({
    mutationFn: (broadcastId: number) => unblockAdminBroadcastApi(broadcastId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.broadcasts });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.broadcastDetails() });
    },
  });

  const handleOpenDetailModal = (broadcast: AdminBroadcast) => {
    setSelectedBroadcast(broadcast);
    setDetailsPage(0);
    setSelectedPeriod('all');
    setShowDetailModal(true);
  };

  const handleOpenBlockModal = (broadcast: AdminBroadcast) => {
    setSelectedBlockBroadcast(broadcast);
    setShowBlockModal(true);
  };

  const formatDateShort = (dateStr?: string | null) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}.${month}.${year}`;
    } catch {
      return dateStr;
    }
  };

  const getStatusBadge = (status: string, isBlocked?: boolean) => {
    if (isBlocked || status === 'BLOCKED') {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase bg-rose-200 text-rose-950 border-2 border-[#0A0A0A]">
          <span>{t('admin.status_blocked')}</span>
        </span>
      );
    }

    switch (status.toUpperCase()) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase bg-emerald-200 text-emerald-950 border-2 border-[#0A0A0A]">
            <span>{t('admin.status_completed')}</span>
          </span>
        );
      case 'RUNNING':
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase bg-cyan-200 text-cyan-950 border-2 border-[#0A0A0A]">
            <span>{t('admin.status_running')}</span>
          </span>
        );
      case 'SCHEDULED':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase bg-amber-200 text-amber-950 border-2 border-[#0A0A0A]">
            <span>{t('admin.status_scheduled')}</span>
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase bg-slate-200 text-slate-900 border-2 border-[#0A0A0A]">
            <span>{t('admin.status_cancelled')}</span>
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase bg-rose-200 text-rose-950 border-2 border-[#0A0A0A]">
            <span>{t('admin.status_failed')}</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase bg-white text-[#0A0A0A] border-2 border-[#0A0A0A]">
            <span>{t('admin.status_draft')}</span>
          </span>
        );
    }
  };

  const statusOptions = [
    { value: 'all', label: t('admin.all_statuses') },
    { value: 'COMPLETED', label: t('admin.status_completed') },
    { value: 'RUNNING', label: t('admin.status_running') },
    { value: 'SCHEDULED', label: t('admin.status_scheduled') },
    { value: 'CANCELLED', label: t('admin.status_cancelled') },
    { value: 'BLOCKED', label: t('admin.status_blocked') },
    { value: 'FAILED', label: t('admin.status_failed') },
    { value: 'DRAFT', label: t('admin.status_draft') },
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
            <AdminSearchBar
              placeholder={t('admin.search_broadcasts_placeholder')}
              value={searchQuery}
              onChange={setSearchQuery}
            />

            <AdminBulkActions
              selectedCount={selectedIds.length}
              actions={[
                { label: t('admin.bulk_cancel'), onClick: handleBulkCancel, icon: <Ban size={14} className="text-[#0A0A0A]" /> },
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
                        <th className="py-3.5 px-4">{t('admin.title_col')}</th>
                        <th className="py-3.5 px-4">{t('admin.audience_col')}</th>
                        <th className="py-3.5 px-4 text-center">{t('admin.delivered_col')}</th>
                        <th className="py-3.5 px-4">{t('admin.created_by_col')}</th>
                        <th className="py-3.5 px-4">{t('admin.date_col')}</th>
                        <th className="py-3.5 px-4 text-center">{t('admin.status_col')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#0A0A0A]/20">
                      {broadcasts.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-slate-700 font-bold">
                            {t('admin.no_broadcasts_found')}
                          </td>
                        </tr>
                      ) : (
                        broadcasts.map((b) => {
                          const isBlocked = b.blocked || b.status === 'BLOCKED';

                          return (
                            <tr
                              key={b.id}
                              onClick={() => handleOpenDetailModal(b)}
                              className={`transition cursor-pointer group ${
                                isBlocked
                                  ? 'bg-rose-100/60 hover:bg-rose-100'
                                  : 'hover:bg-white'
                              }`}
                              title="Переглянути деталі розсилки"
                            >
                              <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="checkbox"
                                  checked={selectedIds.includes(b.id)}
                                  onChange={() => handleToggleSelectRow(b.id)}
                                  className="w-4 h-4 rounded border-2 border-[#0A0A0A] text-[#0A0A0A] accent-[#0A0A0A] cursor-pointer"
                                />
                              </td>
                              <td className="py-3.5 px-4">
                                <div className="flex flex-col">
                                  <span className="font-black text-[#0A0A0A] group-hover:underline transition text-xs">{b.title}</span>
                                  <span className="text-[11px] text-slate-700 line-clamp-1 font-bold mt-0.5">{b.content}</span>
                                </div>
                              </td>

                              <td className="py-3.5 px-4">
                                <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-white border border-[#0A0A0A] text-[#0A0A0A] font-black text-[10px]">
                                  <Users size={12} className="text-[#0A0A0A]" />
                                  <span>
                                    {b.targetAudience === 'ALL_USERS' ? t('admin.target_audience_all') : (b.botName || t('admin.target_audience_bot'))}
                                  </span>
                                </span>
                              </td>

                              <td className="py-3.5 px-4 text-center font-mono font-black text-[#0A0A0A]">
                                {b.sentCount}
                              </td>

                              <td className="py-3.5 px-4">
                                <div
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`${ROUTES.ADMIN_USERS}?search=${encodeURIComponent(b.createdByEmail || '')}`);
                                  }}
                                  className="flex flex-col cursor-pointer group/author inline-flex hover:opacity-80 transition"
                                  title="Переглянути профіль користувача"
                                >
                                  <span className="font-black text-[#0A0A0A] group-hover/author:underline text-xs">
                                    {b.authorName || (b.createdByEmail || '').split('@')[0]}
                                  </span>
                                  <span className="text-[10px] text-slate-700 font-mono font-bold">
                                    {b.createdByEmail}
                                  </span>
                                </div>
                              </td>

                              <td className="py-3.5 px-4 text-slate-700 font-mono text-[11px] font-bold">
                                {formatDateShort(b.createdAt)}
                              </td>

                              <td className="py-3.5 px-4 text-center">
                                {getStatusBadge(b.status || '', isBlocked)}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="px-5 py-3.5 bg-[#F2EBDD] border-t-2 border-[#0A0A0A]">
                  <AdminPagination
                    page={page}
                    totalPages={totalPages}
                    totalElements={totalElements}
                    currentCount={broadcasts.length}
                    onPageChange={setPage}
                  />
                </div>
              </div>
            </>
          )}
        </main>

        {showDetailModal && selectedBroadcast && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A0A0A]/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
            <div className="bg-[#F2EBDD] border-4 border-[#0A0A0A] rounded-3xl w-full max-w-4xl max-h-[90vh] p-6 sm:p-7 shadow-[10px_10px_0px_#0A0A0A] flex flex-col justify-between space-y-5 overflow-hidden text-[#0A0A0A] font-['JetBrains_Mono',monospace]">
              
              <div className="flex items-start justify-between border-b-2 border-[#0A0A0A] pb-4 shrink-0">
                <div className="flex items-start space-x-3.5">
                  <div className="p-3 rounded-2xl bg-white border-2 border-[#0A0A0A] text-[#0A0A0A] shrink-0 mt-0.5 shadow-[2px_2px_0px_#0A0A0A]">
                    <Send size={22} />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h2 className="font-['Anybody',sans-serif] text-lg font-black uppercase text-[#0A0A0A] tracking-tight">{selectedBroadcast.title}</h2>
                      {getStatusBadge(selectedBroadcast.status || '', selectedBroadcast.blocked)}
                    </div>
                    <div className="text-xs text-slate-700 font-bold flex items-center gap-2 flex-wrap">
                      <span>
                        {t('admin.author')}:{' '}
                        <button
                          type="button"
                          onClick={() => {
                            setShowDetailModal(false);
                            navigate(`${ROUTES.ADMIN_USERS}?search=${encodeURIComponent(selectedBroadcast.createdByEmail || '')}`);
                          }}
                          className="font-black text-[#0A0A0A] hover:underline cursor-pointer transition"
                          title="Перейти до профілю користувача"
                        >
                          {selectedBroadcast.authorName || (selectedBroadcast.createdByEmail || '').split('@')[0]} ({selectedBroadcast.createdByEmail})
                        </button>
                      </span>
                      <span>•</span>
                      <span>ID: <strong className="text-[#0A0A0A] font-black">#{selectedBroadcast.id}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {isAdmin && (
                    selectedBroadcast.blocked ? (
                      <button
                        type="button"
                        onClick={() => {
                          unblockMutation.mutate(selectedBroadcast.id);
                          setShowDetailModal(false);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-emerald-200 border-2 border-[#0A0A0A] text-emerald-950 font-black uppercase text-xs flex items-center space-x-1.5 hover:bg-emerald-300 transition cursor-pointer shadow-[2px_2px_0px_#0A0A0A]"
                      >
                        <Unlock size={14} />
                        <span>{t('admin.unblock_broadcast')}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setShowDetailModal(false);
                          handleOpenBlockModal(selectedBroadcast);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-rose-200 border-2 border-[#0A0A0A] text-rose-950 font-black uppercase text-xs flex items-center space-x-1.5 hover:bg-rose-300 transition cursor-pointer shadow-[2px_2px_0px_#0A0A0A]"
                      >
                        <Lock size={14} />
                        <span>{t('admin.block_broadcast')}</span>
                      </button>
                    )
                  )}

                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="w-8 h-8 flex items-center justify-center rounded-xl border-2 border-[#0A0A0A] bg-white text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-white transition-all cursor-pointer shadow-sm ml-1"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              <div className="space-y-5 overflow-y-auto pr-1 flex-1">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                  <div className="p-4 bg-white border-2 border-[#0A0A0A] rounded-2xl flex items-center space-x-3 shadow-[2px_2px_0px_#0A0A0A]">
                    <div className="p-2.5 rounded-xl bg-[#F2EBDD] border border-[#0A0A0A] text-[#0A0A0A]">
                      <Users size={18} />
                    </div>
                    <div>
                      <div className="text-[10px] font-black uppercase text-slate-700 tracking-wider">{t('admin.audience_col')}</div>
                      <div className="text-sm font-black text-[#0A0A0A] mt-0.5 truncate max-w-[110px]">
                        {selectedBroadcast.targetAudience === 'ALL_USERS' ? t('admin.target_audience_all') : (selectedBroadcast.botName || t('admin.target_audience_bot'))}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-white border-2 border-[#0A0A0A] rounded-2xl flex items-center space-x-3 shadow-[2px_2px_0px_#0A0A0A]">
                    <div className="p-2.5 rounded-xl bg-[#F2EBDD] border border-[#0A0A0A] text-[#0A0A0A]">
                      <CheckCircle2 size={18} />
                    </div>
                    <div>
                      <div className="text-[10px] font-black uppercase text-slate-700 tracking-wider">{t('admin.delivered_col')}</div>
                      <div className="text-base font-black font-mono text-[#0A0A0A] mt-0.5">{selectedBroadcast.sentCount}</div>
                    </div>
                  </div>

                  <div className="p-4 bg-white border-2 border-[#0A0A0A] rounded-2xl flex items-center space-x-3 shadow-[2px_2px_0px_#0A0A0A]">
                    <div className="p-2.5 rounded-xl bg-[#F2EBDD] border border-[#0A0A0A] text-[#0A0A0A]">
                      <AlertCircle size={18} />
                    </div>
                    <div>
                      <div className="text-[10px] font-black uppercase text-slate-700 tracking-wider">{t('admin.errors_col')}</div>
                      <div className="text-base font-black font-mono text-[#0A0A0A] mt-0.5">{selectedBroadcast.failedCount || 0}</div>
                    </div>
                  </div>

                  <div className="p-4 bg-white border-2 border-[#0A0A0A] rounded-2xl flex items-center space-x-3 shadow-[2px_2px_0px_#0A0A0A]">
                    <div className="p-2.5 rounded-xl bg-[#F2EBDD] border border-[#0A0A0A] text-[#0A0A0A]">
                      <Send size={18} />
                    </div>
                    <div>
                      <div className="text-[10px] font-black uppercase text-slate-700 tracking-wider">{t('admin.total_records')}</div>
                      <div className="text-base font-black font-mono text-[#0A0A0A] mt-0.5">{selectedBroadcast.totalCount || selectedBroadcast.sentCount}</div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between px-4 py-2.5 bg-white border-2 border-[#0A0A0A] rounded-2xl text-xs shadow-[2px_2px_0px_#0A0A0A]">
                  <div className="flex items-center space-x-2">
                    <Filter size={14} className="text-[#0A0A0A]" />
                    <span className="font-black uppercase text-[#0A0A0A] text-[10px] tracking-wider">{t('admin.period_label')}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    {(
                      [
                        { key: '7d', label: t('admin.period_7d') },
                        { key: '30d', label: t('admin.period_30d') },
                        { key: '90d', label: t('admin.period_90d') },
                        { key: 'all', label: t('admin.period_all') },
                      ] as const
                    ).map((p) => (
                      <button
                        key={p.key}
                        onClick={() => {
                          setSelectedPeriod(p.key);
                          setDetailsPage(0);
                        }}
                        className={`px-3 py-1 rounded-xl text-xs font-black uppercase transition cursor-pointer ${
                          selectedPeriod === p.key
                            ? 'bg-[#0A0A0A] text-[#F2EBDD]'
                            : 'text-[#0A0A0A] hover:bg-[#F2EBDD]'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-2 border-[#0A0A0A] rounded-2xl p-4 space-y-3 bg-white shadow-[2px_2px_0px_#0A0A0A]">
                  <div className="flex items-center justify-between pb-1 border-b-2 border-[#0A0A0A]">
                    <div className="flex items-center space-x-2 text-xs font-black uppercase text-[#0A0A0A]">
                      <Clock size={16} className="text-[#0A0A0A]" />
                      <span>{t('admin.broadcast_history_title')}</span>
                    </div>
                    <span className="text-[11px] font-bold text-slate-700">
                      {t('admin.total_records')} {detailsData?.activities.totalElements || 0}
                    </span>
                  </div>

                  <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                    {isDetailsLoading ? (
                      <div className="flex items-center justify-center py-10">
                        <Loader2 className="animate-spin text-[#0A0A0A]" size={24} />
                      </div>
                    ) : !detailsData?.activities.content.length ? (
                      <div className="py-8 text-center text-xs font-bold text-slate-700">
                        {t('admin.no_activity_history')}
                      </div>
                    ) : (
                      detailsData.activities.content.map((act) => (
                        <div
                          key={act.id}
                          className="p-3.5 bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-xl space-y-1 hover:bg-white transition flex items-start justify-between gap-4"
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-black text-xs text-[#0A0A0A]">{t(act.title) !== act.title ? t(act.title) : act.title}</span>
                              {act.badge && (
                                <span className="px-2 py-0.5 rounded-md bg-white border border-[#0A0A0A] text-[#0A0A0A] font-black text-[9px] uppercase">
                                  {act.badge}
                                </span>
                              )}
                            </div>
                            {act.description && (
                              <p className="text-xs text-slate-800 font-bold leading-normal">{act.description}</p>
                            )}
                          </div>
                          <span className="text-[11px] font-mono text-slate-700 font-bold shrink-0">
                            {formatEuroDateTime(act.timestamp)}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t-2 border-[#0A0A0A] shrink-0">
                <div className="flex items-center space-x-2">
                  <button
                    disabled={detailsPage === 0}
                    onClick={() => setDetailsPage((prev) => Math.max(prev - 1, 0))}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-xl border-2 border-[#0A0A0A] bg-white hover:bg-[#0A0A0A] hover:text-[#F2EBDD] text-[#0A0A0A] text-xs font-black uppercase disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer shadow-[2px_2px_0px_#0A0A0A]"
                  >
                    <ChevronLeft size={14} />
                    <span>{t('admin.prev')}</span>
                  </button>
                  <span className="text-xs font-black font-mono text-[#0A0A0A] px-1">
                    {t('admin.page')} <strong>{detailsPage + 1}</strong> {t('admin.of')}{' '}
                    <strong>{detailsData?.activities.totalPages || 1}</strong>
                  </span>
                  <button
                    disabled={!detailsData || detailsPage >= detailsData.activities.totalPages - 1}
                    onClick={() => setDetailsPage((prev) => prev + 1)}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-xl border-2 border-[#0A0A0A] bg-white hover:bg-[#0A0A0A] hover:text-[#F2EBDD] text-[#0A0A0A] text-xs font-black uppercase disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer shadow-[2px_2px_0px_#0A0A0A]"
                  >
                    <span>{t('admin.next')}</span>
                    <ChevronRight size={14} />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setShowDetailModal(false)}
                  className="px-6 py-2.5 rounded-xl text-xs font-black uppercase text-[#F2EBDD] bg-[#0A0A0A] border-2 border-[#0A0A0A] hover:bg-[#2A2A2A] transition shadow-[2px_2px_0px_#0A0A0A] cursor-pointer"
                >
                  {t('admin.close')}
                </button>
              </div>
            </div>
          </div>
        )}

        <AdminBlockModal
          isOpen={showBlockModal && Boolean(selectedBlockBroadcast)}
          onClose={() => setShowBlockModal(false)}
          onConfirm={(reasonCode, details) => {
            if (!selectedBlockBroadcast) return;
            const reasonMap: Record<string, string> = {
              SUSPICIOUS_ACTIVITY: 'Suspicious activity',
              PLATFORM_VIOLATION: 'Violation of platform rules',
              SPAM: 'Spam or unauthorized bulk messaging',
              OTHER: details?.trim() || 'Violation of platform rules',
            };
            const finalReason = reasonMap[reasonCode] || details || reasonCode;
            blockMutation.mutate({ broadcastId: selectedBlockBroadcast.id, reason: finalReason });
          }}
          title={t('admin.block_broadcast_title')}
          entityInfo={selectedBlockBroadcast && (
            <div className="bg-white p-3.5 rounded-2xl border-2 border-[#0A0A0A] text-xs text-[#0A0A0A] space-y-1">
              <div>Title: <strong className="text-[#0A0A0A] font-black">{selectedBlockBroadcast.title}</strong></div>
              <div className="text-slate-700 font-bold">ID: #{selectedBlockBroadcast.id}</div>
            </div>
          )}
          reasons={[
            { code: 'SUSPICIOUS_ACTIVITY', label: t('admin.block_reason_suspicious') },
            { code: 'PLATFORM_VIOLATION', label: t('admin.block_reason_rules') },
            { code: 'SPAM', label: t('admin.block_reason_spam') },
            { code: 'OTHER', label: t('admin.block_reason_other') },
          ]}
          isPending={blockMutation.isPending}
        />
      </div>
    </AdminLayout>
  );
};

export default AdminBroadcastsPage;
