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
import { fetchAdminUserDetailsApi } from '../../../../api/admin';
import type { AdminUser } from '../../../../api/admin';
import { formatAuditTitle, formatAuditDescription } from '../../../../utils/auditFormatters';
import { formatEuroDateTime } from '../../../../utils/date';
import { ROUTES } from '../../../../routes/paths';
import { useTranslation } from '../../../../i18n/config';

interface AdminUserDetailModalProps {
  isOpen: boolean;
  user: AdminUser | null;
  isAdmin: boolean;
  onClose: () => void;
  onOpenRoleModal: (user: AdminUser) => void;
  onOpenBlockModal: (user: AdminUser) => void;
}

export const AdminUserDetailModal: React.FC<AdminUserDetailModalProps> = ({
  isOpen,
  user,
  isAdmin,
  onClose,
  onOpenRoleModal,
  onOpenBlockModal,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [detailPeriod, setDetailPeriod] = useState<'week' | 'month' | '3months' | 'all'>('all');
  const [activityCategoryFilter, setActivityCategoryFilter] = useState<'all' | 'automations' | 'broadcasts' | 'system'>('all');
  const [activityPage, setActivityPage] = useState(0);

  const { data: userDetailData, isLoading: isDetailLoading } = useQuery({
    queryKey: ['adminUserDetails', user?.id, detailPeriod, activityCategoryFilter, activityPage],
    queryFn: () => fetchAdminUserDetailsApi(user!.id, detailPeriod, activityCategoryFilter, activityPage, 20),
    enabled: !!user && isOpen,
  });

  if (!isOpen || !user) return null;

  const translateAuditTitle = (title: string, targetName?: string) => formatAuditTitle(title, targetName, t);
  const translateAuditDescription = (desc: string) => formatAuditDescription(desc, t);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A0A0A]/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-[#F2EBDD] border-4 border-[#0A0A0A] rounded-3xl w-full max-w-6xl h-[780px] max-h-[92vh] p-6 sm:p-7 shadow-[10px_10px_0px_#0A0A0A] flex flex-col justify-between space-y-4 overflow-hidden text-[#0A0A0A] font-['JetBrains_Mono',monospace]">
        <div className="flex items-center justify-between border-b-2 border-[#0A0A0A] pb-3.5 shrink-0">
          <div className="flex items-center space-x-3.5">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                referrerPolicy="no-referrer"
                className="w-12 h-12 rounded-xl object-cover border-2 border-[#0A0A0A]"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-white border-2 border-[#0A0A0A] flex items-center justify-center font-black text-[#0A0A0A] text-lg">
                {user.name ? user.name[0].toUpperCase() : 'U'}
              </div>
            )}

            <div className="space-y-0.5">
              <div className="flex items-center space-x-2">
                <h3 className="font-['Anybody',sans-serif] text-base font-black uppercase text-[#0A0A0A] leading-tight">
                  {user.name}
                </h3>
                <span className="px-2 py-0.5 rounded-md bg-white border border-[#0A0A0A] text-[#0A0A0A] font-black text-[10px] uppercase">
                  {user.role}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase border-2 border-[#0A0A0A] ${
                    user.active
                      ? 'bg-emerald-200 text-emerald-950'
                      : 'bg-rose-200 text-rose-950'
                  }`}
                >
                  {user.active ? t('admin.active') : t('admin.blocked')}
                </span>
              </div>

              <div className="text-xs text-slate-700 font-mono flex items-center space-x-2 font-bold">
                <span>{user.email}</span>
                {user.telegramUsername && (
                  <span className="text-[#0A0A0A]">@{user.telegramUsername}</span>
                )}
                <span>ID: #{user.id}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {isAdmin && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenRoleModal(user);
                }}
                className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-[#0A0A0A] hover:text-[#F2EBDD] text-[#0A0A0A] font-black uppercase text-xs border-2 border-[#0A0A0A] transition cursor-pointer shadow-[2px_2px_0px_#0A0A0A]"
              >
                {t('admin.role')}
              </button>
            )}

            {isAdmin && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenBlockModal(user);
                }}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-black uppercase transition cursor-pointer border-2 border-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A] ${
                  user.active
                    ? 'bg-rose-200 text-rose-950 hover:bg-rose-300'
                    : 'bg-emerald-200 text-emerald-950 hover:bg-emerald-300'
                }`}
              >
                {user.active ? t('admin.block') : t('admin.unblock')}
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-xl border-2 border-[#0A0A0A] bg-white text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-white transition-all cursor-pointer shadow-sm ml-1"
            >
              <X size={16} />
            </button>
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
                { id: 'all', label: t('admin.all_time') },
              ] as const
            ).map((p) => (
              <button
                key={p.id}
                type="button"
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

          <div className="flex items-center space-x-1">
            <span className="text-[11px] font-black text-[#0A0A0A] uppercase mr-1 flex items-center gap-1">
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
                  setActivityCategoryFilter(c.id);
                  setActivityPage(0);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase transition cursor-pointer ${
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
              {isDetailLoading ? '...' : (userDetailData?.botsCount ?? 0)}
            </div>
          </div>

          <div className="bg-white border-2 border-[#0A0A0A] rounded-xl p-2.5 shadow-[2px_2px_0px_#0A0A0A]">
            <div className="text-[10px] font-black uppercase text-slate-700">{t('admin.cat_automations')}</div>
            <div className="text-base font-black text-[#0A0A0A] mt-0.5">
              {isDetailLoading ? '...' : (userDetailData?.automationsCount ?? 0)}
            </div>
          </div>

          <div className="bg-white border-2 border-[#0A0A0A] rounded-xl p-2.5 shadow-[2px_2px_0px_#0A0A0A]">
            <div className="text-[10px] font-black uppercase text-slate-700">{t('admin.cat_broadcasts')}</div>
            <div className="text-base font-black text-[#0A0A0A] mt-0.5">
              {isDetailLoading ? '...' : (userDetailData?.broadcastsCount ?? 0)}
            </div>
          </div>

          <div className="bg-white border-2 border-[#0A0A0A] rounded-xl p-2.5 shadow-[2px_2px_0px_#0A0A0A]">
            <div className="text-[10px] font-black uppercase text-slate-700">{t('admin.subscribers')}</div>
            <div className="text-base font-black text-[#0A0A0A] mt-0.5">
              {isDetailLoading ? '...' : (userDetailData?.contactsCount ?? 0)}
            </div>
          </div>

          <div className="bg-white border-2 border-[#0A0A0A] rounded-xl p-2.5 shadow-[2px_2px_0px_#0A0A0A]">
            <div className="text-[10px] font-black uppercase text-slate-700">{t('admin.messages_sent')}</div>
            <div className="text-base font-black text-[#0A0A0A] mt-0.5">
              {isDetailLoading ? '...' : (userDetailData?.messagesCount ?? 0)}
            </div>
          </div>

          <div className="bg-white border-2 border-[#0A0A0A] rounded-xl p-2.5 shadow-[2px_2px_0px_#0A0A0A]">
            <div className="text-[10px] font-black uppercase text-slate-700">{t('admin.subscription_plan')}</div>
            <div className="text-xs font-black text-[#0A0A0A] mt-1 truncate">
              {isDetailLoading ? '...' : (userDetailData?.planName || 'FREE')}
            </div>
          </div>
        </div>

        {!user.active && user.blockReason && (
          <div className="bg-rose-100 border-2 border-[#0A0A0A] rounded-xl p-2.5 text-xs text-rose-950 font-bold shrink-0 shadow-[2px_2px_0px_#0A0A0A]">
            <span className="font-black">{t('blocked.reason_title')}</span> {user.blockReason}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 flex-1 min-h-0 overflow-hidden">
          <div className="lg:col-span-5 flex flex-col space-y-3 min-h-0 h-full overflow-hidden">
            <div className="flex-1 flex flex-col min-h-0 border-2 border-[#0A0A0A] rounded-2xl bg-white p-3 overflow-hidden shadow-[2px_2px_0px_#0A0A0A]">
              <div className="flex items-center justify-between pb-2 border-b-2 border-[#0A0A0A] text-xs font-black uppercase text-[#0A0A0A] shrink-0">
                <span>{t('admin.automations')}</span>
                {userDetailData?.automations && (
                  <span className="text-[11px] font-mono text-[#0A0A0A] font-bold">
                    {t('admin.total')}: {userDetailData.automations.length}
                  </span>
                )}
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pt-2 pr-1">
                {isDetailLoading ? (
                  <div className="flex items-center justify-center py-6 text-slate-700 text-xs font-bold">
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
                            className={`w-2 h-2 rounded-full border border-[#0A0A0A] shrink-0 ${
                              auto.active ? 'bg-emerald-400' : 'bg-slate-300'
                            }`}
                          />
                          <span className="font-black text-[#0A0A0A] text-xs truncate group-hover:underline">
                            {auto.name}
                          </span>
                        </div>
                        <ChevronRight size={14} className="text-[#0A0A0A] shrink-0 mt-0.5" />
                      </div>

                      <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-[#0A0A0A]/20 text-[10px] font-mono">
                        {auto.botName && auto.botName !== '—' ? (
                          <span className="flex items-center gap-1 text-[#0A0A0A] font-bold truncate max-w-[120px]">
                            <span className="truncate">{auto.botName}</span>
                          </span>
                        ) : (
                          <span className="text-slate-500 font-bold">—</span>
                        )}
                        <span className="font-black text-[#0A0A0A]">RUNS: {auto.triggerCount}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex-1 flex flex-col min-h-0 border-2 border-[#0A0A0A] rounded-2xl bg-white p-3 overflow-hidden shadow-[2px_2px_0px_#0A0A0A]">
              <div className="flex items-center justify-between pb-2 border-b-2 border-[#0A0A0A] text-xs font-black uppercase text-[#0A0A0A] shrink-0">
                <span>{t('admin.cat_broadcasts')}</span>
                {userDetailData?.broadcasts && (
                  <span className="text-[11px] font-mono text-[#0A0A0A] font-bold">
                    {t('admin.total')}: {userDetailData.broadcasts.length}
                  </span>
                )}
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pt-2 pr-1">
                {isDetailLoading ? (
                  <div className="flex items-center justify-center py-6 text-slate-700 text-xs font-bold">
                    <Loader2 size={16} className="animate-spin mr-2" />
                    {t('admin.loading_history')}
                  </div>
                ) : !userDetailData?.broadcasts?.length ? (
                  <div className="text-center py-6 text-slate-700 text-xs font-bold">
                    {t('admin.no_records')}
                  </div>
                ) : (
                  userDetailData.broadcasts.map((bc) => (
                    <div
                      key={bc.id}
                      onClick={() => {
                        onClose();
                        navigate(`${ROUTES.ADMIN_BROADCASTS}?search=${encodeURIComponent(bc.name)}`);
                      }}
                      className="bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-xl p-2.5 hover:bg-white cursor-pointer transition group flex flex-col justify-between"
                      title="Перейти до цієї розсилки"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center space-x-2 min-w-0">
                          <span className="font-black text-[#0A0A0A] text-xs truncate group-hover:underline">
                            {bc.name}
                          </span>
                        </div>
                        <ChevronRight size={14} className="text-[#0A0A0A] shrink-0 mt-0.5" />
                      </div>

                      <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-[#0A0A0A]/20 text-[10px] font-mono">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-white border border-[#0A0A0A] text-[#0A0A0A] font-black uppercase">
                          {bc.status}
                        </span>
                        <span className="font-black text-[#0A0A0A]">DELIVERED: {bc.sentCount}</span>
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
                <span className="text-[11px] font-mono text-[#0A0A0A] font-bold">
                  {t('admin.total_records')} {userDetailData.activities.totalElements}
                </span>
              )}
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pt-2 pr-1">
              {isDetailLoading ? (
                <div className="flex items-center justify-center py-12 text-slate-700 text-xs font-bold">
                  <Loader2 size={16} className="animate-spin mr-2" />
                  {t('admin.loading_history')}
                </div>
              ) : userDetailData?.activities?.content && userDetailData.activities.content.length > 0 ? (
                <div className="space-y-2">
                  {userDetailData.activities.content.map((act) => (
                    <div
                      key={act.id}
                      className="bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-xl p-3 flex items-start justify-between text-xs transition"
                    >
                      <div className="space-y-1 min-w-0 pr-2">
                        <div className="font-black text-[#0A0A0A] flex items-center space-x-2 truncate">
                          <span className="truncate">{translateAuditTitle(act.title, act.targetName)}</span>
                          <span className="px-1.5 py-0.2 rounded bg-white border border-[#0A0A0A] text-[#0A0A0A] font-mono text-[9px] uppercase font-black shrink-0">
                            {act.badge}
                          </span>
                        </div>
                        <div className="text-slate-800 text-[11px] leading-relaxed font-bold">
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
              onClick={() => setActivityPage((prev) => Math.max(0, prev - 1))}
              disabled={activityPage === 0 || isDetailLoading}
              className="px-2.5 py-1 rounded-lg border-2 border-[#0A0A0A] bg-white text-[#0A0A0A] text-xs font-black uppercase hover:bg-[#0A0A0A] hover:text-[#F2EBDD] disabled:opacity-40 cursor-pointer flex items-center gap-1"
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
              onClick={() => setActivityPage((prev) => prev + 1)}
              disabled={
                !userDetailData?.activities ||
                activityPage + 1 >= userDetailData.activities.totalPages ||
                isDetailLoading
              }
              className="px-2.5 py-1 rounded-lg border-2 border-[#0A0A0A] bg-white text-[#0A0A0A] text-xs font-black uppercase hover:bg-[#0A0A0A] hover:text-[#F2EBDD] disabled:opacity-40 cursor-pointer flex items-center gap-1"
            >
              <span>{t('admin.next_page')}</span>
              <ChevronRight size={14} />
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-black uppercase text-[#F2EBDD] bg-[#0A0A0A] border-2 border-[#0A0A0A] hover:bg-[#2A2A2A] cursor-pointer transition shadow-[2px_2px_0px_#0A0A0A]"
          >
            {t('admin.close')}
          </button>
        </div>
      </div>
    </div>
  );
};
