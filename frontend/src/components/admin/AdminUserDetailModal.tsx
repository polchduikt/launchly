import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  X,
  Loader2,
  Calendar,
  Filter,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { fetchAdminUserDetailsApi } from '../../api/admin';
import type { AdminUser, AdminUserDetail, AdminSupportTicket } from '../../api/admin';
import { formatAuditTitle, formatAuditDescription } from '../../utils/auditFormatters';
import { formatEuroDateTime } from '../../utils/date';
import { ROUTES } from '../../routes/paths';
import { useTranslation } from '../../i18n/config';

export interface AdminUserDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: AdminUser | null;
  selectedTicket?: AdminSupportTicket | null;
  isAdmin?: boolean;
  onOpenRoleModal?: (user: AdminUser) => void;
  onOpenBlockModal?: (user: AdminUser) => void;
  userDetailData?: AdminUserDetail | null;
  isDetailLoading?: boolean;
  detailPeriod?: 'week' | 'month' | '3months' | 'all';
  setDetailPeriod?: (p: 'week' | 'month' | '3months' | 'all') => void;
  activityCategoryFilter?: 'all' | 'automations' | 'broadcasts' | 'system';
  setActivityCategoryFilter?: (c: 'all' | 'automations' | 'broadcasts' | 'system') => void;
  activityPage?: number;
  setActivityPage?: React.Dispatch<React.SetStateAction<number>>;
}

export const AdminUserDetailModal: React.FC<AdminUserDetailModalProps> = ({
  isOpen,
  onClose,
  user,
  selectedTicket,
  isAdmin = false,
  onOpenRoleModal,
  onOpenBlockModal,
  userDetailData: controlledUserDetailData,
  isDetailLoading: controlledIsDetailLoading,
  detailPeriod: controlledDetailPeriod,
  setDetailPeriod: controlledSetDetailPeriod,
  activityCategoryFilter: controlledActivityCategoryFilter,
  setActivityCategoryFilter: controlledSetActivityCategoryFilter,
  activityPage: controlledActivityPage,
  setActivityPage: controlledSetActivityPage,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [internalDetailPeriod, setInternalDetailPeriod] = useState<'week' | 'month' | '3months' | 'all'>('all');
  const [internalActivityCategoryFilter, setInternalActivityCategoryFilter] = useState<'all' | 'automations' | 'broadcasts' | 'system'>('all');
  const [internalActivityPage, setInternalActivityPage] = useState(0);

  const detailPeriod = controlledDetailPeriod ?? internalDetailPeriod;
  const activityCategoryFilter = controlledActivityCategoryFilter ?? internalActivityCategoryFilter;
  const activityPage = controlledActivityPage ?? internalActivityPage;

  const handleSetDetailPeriod = (period: 'week' | 'month' | '3months' | 'all') => {
    if (controlledSetDetailPeriod) {
      controlledSetDetailPeriod(period);
    } else {
      setInternalDetailPeriod(period);
    }
  };

  const handleSetActivityCategoryFilter = (cat: 'all' | 'automations' | 'broadcasts' | 'system') => {
    if (controlledSetActivityCategoryFilter) {
      controlledSetActivityCategoryFilter(cat);
    } else {
      setInternalActivityCategoryFilter(cat);
    }
  };

  const handleSetActivityPage = (updater: number | ((prev: number) => number)) => {
    if (controlledSetActivityPage) {
      controlledSetActivityPage(updater);
    } else {
      setInternalActivityPage(updater);
    }
  };

  const normalizedUser = user
    ? {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        active: user.active,
        telegramUsername: user.telegramUsername,
        blockReason: user.blockReason,
        planName: user.planName,
        botsCount: user.botsCount,
        automationsCount: user.automationsCount,
        broadcastsCount: user.broadcastsCount,
        contactsCount: user.contactsCount,
        messagesCount: user.messagesCount,
        rawUser: user,
      }
    : selectedTicket
    ? {
        id: selectedTicket.userId,
        name: selectedTicket.userName,
        email: selectedTicket.userEmail,
        avatar: selectedTicket.userAvatar,
        role: selectedTicket.userRole || 'ROLE_OWNER',
        active: selectedTicket.accountActive !== false,
        telegramUsername: undefined,
        blockReason: undefined,
        planName: selectedTicket.userPlan,
        botsCount: selectedTicket.botsCount,
        automationsCount: selectedTicket.automationsCount,
        broadcastsCount: selectedTicket.broadcastsCount,
        contactsCount: selectedTicket.contactsCount ?? 0,
        messagesCount: selectedTicket.messagesCount ?? 0,
        rawUser: null,
      }
    : null;

  const { data: fetchedUserDetailData, isLoading: isFetchedLoading } = useQuery({
    queryKey: ['adminUserDetails', normalizedUser?.id, detailPeriod, activityCategoryFilter, activityPage],
    queryFn: () => fetchAdminUserDetailsApi(normalizedUser!.id, detailPeriod, activityCategoryFilter, activityPage, 20),
    enabled: !!normalizedUser?.id && isOpen && controlledUserDetailData === undefined,
  });

  if (!isOpen || !normalizedUser) return null;

  const userDetailData = controlledUserDetailData ?? fetchedUserDetailData;
  const isDetailLoading = controlledIsDetailLoading ?? isFetchedLoading;

  const translateAuditTitle = (title: string, targetName?: string) => formatAuditTitle(title, targetName, t);
  const translateAuditDescription = (desc: string) => formatAuditDescription(desc, t);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A0A0A]/40 backdrop-blur-xs p-4 animate-in fade-in duration-150 font-['JetBrains_Mono',monospace]">
      <div className="bg-[#F2EBDD] border-4 border-[#0A0A0A] rounded-3xl w-full max-w-6xl h-[780px] max-h-[92vh] p-6 sm:p-7 shadow-[10px_10px_0px_#0A0A0A] flex flex-col justify-between space-y-4 overflow-hidden text-[#0A0A0A]">
        <div className="flex items-center justify-between border-b-2 border-[#0A0A0A] pb-3.5 shrink-0">
          <div className="flex items-center space-x-3.5">
            {normalizedUser.avatar ? (
              <img
                src={normalizedUser.avatar}
                alt={normalizedUser.name}
                referrerPolicy="no-referrer"
                className="w-12 h-12 rounded-2xl object-cover border-2 border-[#0A0A0A]"
              />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-amber-200 border-2 border-[#0A0A0A] flex items-center justify-center font-black text-[#0A0A0A] text-lg shadow-[2px_2px_0px_#0A0A0A]">
                {normalizedUser.name ? normalizedUser.name[0].toUpperCase() : 'U'}
              </div>
            )}

            <div className="space-y-0.5">
              <div className="flex items-center space-x-2">
                <h3 className="font-['Anybody',sans-serif] text-base font-black uppercase text-[#0A0A0A] leading-tight">
                  {normalizedUser.name}
                </h3>
                <span className="px-2 py-0.5 rounded-lg bg-white border-2 border-[#0A0A0A] text-[#0A0A0A] font-black text-[10px] uppercase">
                  {normalizedUser.role}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase border-2 border-[#0A0A0A] ${
                    normalizedUser.active
                      ? 'bg-emerald-200 text-emerald-950'
                      : 'bg-rose-200 text-rose-950'
                  }`}
                >
                  {normalizedUser.active ? t('admin.active') : t('admin.blocked')}
                </span>
              </div>

              <div className="text-xs text-slate-700 font-mono font-bold flex items-center space-x-2">
                <span>{normalizedUser.email}</span>
                {normalizedUser.telegramUsername && (
                  <span className="text-[#0A0A0A]">@{normalizedUser.telegramUsername}</span>
                )}
                <span>ID: #{normalizedUser.id}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {isAdmin && normalizedUser.rawUser && onOpenRoleModal && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenRoleModal(normalizedUser.rawUser!);
                }}
                className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-[#0A0A0A] hover:text-[#F2EBDD] text-[#0A0A0A] font-black uppercase text-xs border-2 border-[#0A0A0A] transition cursor-pointer shadow-[2px_2px_0px_#0A0A0A]"
              >
                {t('admin.role')}
              </button>
            )}

            {isAdmin && normalizedUser.rawUser && onOpenBlockModal && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenBlockModal(normalizedUser.rawUser!);
                }}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-black uppercase transition cursor-pointer border-2 border-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A] ${
                  normalizedUser.active
                    ? 'bg-rose-200 text-rose-950 hover:bg-rose-300'
                    : 'bg-emerald-200 text-emerald-950 hover:bg-emerald-300'
                }`}
              >
                {normalizedUser.active ? t('admin.block') : t('admin.unblock')}
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-xl border-2 border-[#0A0A0A] bg-white text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-white transition-all cursor-pointer shadow-sm"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 bg-white p-2.5 rounded-2xl border-2 border-[#0A0A0A] shrink-0 shadow-[2px_2px_0px_#0A0A0A]">
          <div className="flex items-center space-x-1">
            <span className="text-[11px] font-black uppercase text-[#0A0A0A] mr-1 flex items-center gap-1">
              <Calendar size={13} />
              {t('admin.period_label')}
            </span>
            {(
              [
                { id: 'week', label: t('admin.7_days') },
                { id: 'month', label: t('admin.30_days') },
                { id: '3months', label: t('admin.90_days') },
                { id: 'all', label: t('admin.all_time') },
              ] as const
            ).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  handleSetDetailPeriod(p.id);
                  handleSetActivityPage(0);
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
            {(
              [
                { id: 'all', label: t('admin.cat_all') },
                { id: 'automations', label: t('admin.cat_automations') },
                { id: 'broadcasts', label: t('admin.cat_broadcasts') },
                { id: 'system', label: t('admin.cat_system') },
              ] as const
            ).map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  handleSetActivityCategoryFilter(c.id);
                  handleSetActivityPage(0);
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
              {isDetailLoading ? '...' : (userDetailData?.botsCount ?? normalizedUser.botsCount)}
            </div>
          </div>

          <div className="bg-white border-2 border-[#0A0A0A] rounded-xl p-2.5 shadow-[2px_2px_0px_#0A0A0A]">
            <div className="text-[10px] font-black uppercase text-slate-700">{t('admin.cat_automations')}</div>
            <div className="text-base font-black text-[#0A0A0A] mt-0.5">
              {isDetailLoading ? '...' : (userDetailData?.automationsCount ?? normalizedUser.automationsCount)}
            </div>
          </div>

          <div className="bg-white border-2 border-[#0A0A0A] rounded-xl p-2.5 shadow-[2px_2px_0px_#0A0A0A]">
            <div className="text-[10px] font-black uppercase text-slate-700">{t('admin.cat_broadcasts')}</div>
            <div className="text-base font-black text-[#0A0A0A] mt-0.5">
              {isDetailLoading ? '...' : (userDetailData?.broadcastsCount ?? normalizedUser.broadcastsCount)}
            </div>
          </div>

          <div className="bg-white border-2 border-[#0A0A0A] rounded-xl p-2.5 shadow-[2px_2px_0px_#0A0A0A]">
            <div className="text-[10px] font-black uppercase text-slate-700">{t('admin.subscribers')}</div>
            <div className="text-base font-black text-[#0A0A0A] mt-0.5">
              {isDetailLoading ? '...' : (userDetailData?.contactsCount ?? normalizedUser.contactsCount)}
            </div>
          </div>

          <div className="bg-white border-2 border-[#0A0A0A] rounded-xl p-2.5 shadow-[2px_2px_0px_#0A0A0A]">
            <div className="text-[10px] font-black uppercase text-slate-700">{t('admin.messages_sent')}</div>
            <div className="text-base font-black text-[#0A0A0A] mt-0.5">
              {isDetailLoading ? '...' : (userDetailData?.messagesCount ?? normalizedUser.messagesCount)}
            </div>
          </div>

          <div className="bg-white border-2 border-[#0A0A0A] rounded-xl p-2.5 shadow-[2px_2px_0px_#0A0A0A]">
            <div className="text-[10px] font-black uppercase text-slate-700">{t('admin.subscription_plan')}</div>
            <div className="text-xs font-black uppercase text-[#0A0A0A] mt-1 truncate">
              {isDetailLoading ? '...' : (userDetailData?.planName || normalizedUser.planName || 'FREE')}
            </div>
          </div>
        </div>

        {!normalizedUser.active && normalizedUser.blockReason && (
          <div className="bg-rose-100 border-2 border-[#0A0A0A] rounded-xl p-2.5 text-xs text-rose-950 font-bold shrink-0 shadow-[2px_2px_0px_#0A0A0A]">
            <span className="font-black">{t('blocked.reason_title')}</span> {normalizedUser.blockReason}
          </div>
        )}

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
                        onClose();
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
                      <div className="text-[10px] text-slate-700 font-mono font-bold mt-1 flex justify-between">
                        <span>{auto.botName ? `Bot: ${auto.botName}` : `Updated: ${formatEuroDateTime(auto.updatedAt)}`}</span>
                        {auto.triggerCount !== undefined && <span className="font-black text-[#0A0A0A]">RUNS: {auto.triggerCount}</span>}
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
                        onClose();
                        navigate(`${ROUTES.ADMIN_BROADCASTS}?search=${encodeURIComponent(b.name)}`);
                      }}
                      className="bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-xl p-2.5 hover:bg-white cursor-pointer transition group flex flex-col justify-between"
                      title="Перейти до цієї розсилки"
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
                    <div
                      key={act.id}
                      className="bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-xl p-3 flex items-start justify-between text-xs hover:bg-white transition"
                    >
                      <div className="space-y-1 min-w-0 pr-2">
                        <div className="font-black text-[#0A0A0A] flex items-center space-x-2 truncate">
                          <span className="truncate">{translateAuditTitle(act.title, act.targetName)}</span>
                          <span className="px-1.5 py-0.2 rounded bg-white border border-[#0A0A0A] text-[#0A0A0A] font-mono text-[9px] uppercase font-black shrink-0">
                            {act.badge}
                          </span>
                        </div>
                        <div className="text-slate-800 text-[11px] font-bold leading-relaxed">
                          {translateAuditDescription(act.description)}
                        </div>
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
              type="button"
              onClick={() => handleSetActivityPage((prev) => Math.max(0, prev - 1))}
              disabled={activityPage === 0 || isDetailLoading}
              className="px-3 py-1.5 rounded-xl border-2 border-[#0A0A0A] bg-white text-[#0A0A0A] text-xs font-black uppercase hover:bg-[#0A0A0A] hover:text-[#F2EBDD] disabled:opacity-40 cursor-pointer flex items-center gap-1 shadow-[2px_2px_0px_#0A0A0A]"
            >
              <ChevronLeft size={14} />
              <span>{t('admin.prev_page')}</span>
            </button>

            <span className="text-xs text-[#0A0A0A] font-mono font-black px-1">
              {t('admin.page_x_of_y', {
                current: activityPage + 1,
                total: userDetailData?.activities?.totalPages || 1,
              })}
            </span>

            <button
              type="button"
              onClick={() => handleSetActivityPage((prev) => prev + 1)}
              disabled={
                !userDetailData?.activities ||
                activityPage + 1 >= userDetailData.activities.totalPages ||
                isDetailLoading
              }
              className="px-3 py-1.5 rounded-xl border-2 border-[#0A0A0A] bg-white text-[#0A0A0A] text-xs font-black uppercase hover:bg-[#0A0A0A] hover:text-[#F2EBDD] disabled:opacity-40 cursor-pointer flex items-center gap-1 shadow-[2px_2px_0px_#0A0A0A]"
            >
              <span>{t('admin.next_page')}</span>
              <ChevronRight size={14} />
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 rounded-xl text-xs font-black uppercase text-[#F2EBDD] bg-[#0A0A0A] border-2 border-[#0A0A0A] hover:bg-[#2A2A2A] cursor-pointer transition shadow-[2px_2px_0px_#0A0A0A]"
          >
            {t('admin.close')}
          </button>
        </div>
      </div>
    </div>
  );
};
