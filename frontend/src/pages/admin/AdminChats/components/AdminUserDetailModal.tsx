import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Calendar,
  Filter,
  Loader2,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { ROUTES } from '../../../../routes/paths';
import { formatEuroDateTime } from '../../../../utils/date';
import { formatAuditTitle, formatAuditDescription } from '../../../../utils/auditFormatters';
import { useTranslation } from '../../../../i18n/config';
import type {
  AdminUserDetail,
  AdminSupportTicket,
} from '../../../../api/admin';

interface AdminUserDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTicket?: AdminSupportTicket | null;
  userDetailData?: AdminUserDetail | null;
  isDetailLoading: boolean;
  detailPeriod: 'week' | 'month' | '3months' | 'all';
  setDetailPeriod: (p: 'week' | 'month' | '3months' | 'all') => void;
  activityCategoryFilter: 'all' | 'automations' | 'broadcasts' | 'system';
  setActivityCategoryFilter: (c: 'all' | 'automations' | 'broadcasts' | 'system') => void;
  activityPage: number;
  setActivityPage: React.Dispatch<React.SetStateAction<number>>;
}

export const AdminUserDetailModal: React.FC<AdminUserDetailModalProps> = ({
  isOpen,
  onClose,
  selectedTicket,
  userDetailData,
  isDetailLoading,
  detailPeriod,
  setDetailPeriod,
  activityCategoryFilter,
  setActivityCategoryFilter,
  activityPage,
  setActivityPage,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  if (!isOpen || !selectedTicket) return null;

  const translateAuditTitle = (title: string) => formatAuditTitle(title, undefined, t);
  const translateAuditDescription = (desc: string) => formatAuditDescription(desc, t);

  return (
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
                <h3 className="font-['Anybody',sans-serif] text-base font-black uppercase text-[#0A0A0A] leading-tight">
                  {selectedTicket.userName}
                </h3>
                <span className="px-2 py-0.5 rounded-lg bg-white border-2 border-[#0A0A0A] text-[#0A0A0A] font-black text-[10px] uppercase">
                  {selectedTicket.userRole || 'ROLE_OWNER'}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase border-2 border-[#0A0A0A] ${
                    selectedTicket.accountActive !== false
                      ? 'bg-emerald-200 text-emerald-950'
                      : 'bg-rose-200 text-rose-950'
                  }`}
                >
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
                { id: 'all', label: t('admin.all_time') }
              ] as const
            ).map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setDetailPeriod(p.id);
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
            {(
              [
                { id: 'all', label: t('admin.cat_all') },
                { id: 'automations', label: t('admin.cat_automations') },
                { id: 'broadcasts', label: t('admin.cat_broadcasts') },
                { id: 'system', label: t('admin.cat_system') }
              ] as const
            ).map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  setActivityCategoryFilter(c.id);
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
                      <div className="text-[10px] text-slate-700 font-mono font-bold mt-1">
                        {auto.botName ? `Bot: ${auto.botName}` : `Updated: ${formatEuroDateTime(auto.updatedAt)}`}
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
                    <div
                      key={act.id}
                      className="bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-xl p-3 flex items-start justify-between text-xs hover:bg-white transition"
                    >
                      <div className="space-y-1 min-w-0 pr-2">
                        <div className="font-black text-[#0A0A0A] flex items-center space-x-2 truncate">
                          <span className="truncate">{translateAuditTitle(act.title)}</span>
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
              onClick={() => setActivityPage((prev) => Math.max(0, prev - 1))}
              disabled={activityPage === 0 || isDetailLoading}
              className="px-3 py-1.5 rounded-xl border-2 border-[#0A0A0A] bg-white text-[#0A0A0A] text-xs font-black uppercase hover:bg-[#0A0A0A] hover:text-[#F2EBDD] disabled:opacity-40 cursor-pointer flex items-center gap-1 shadow-[2px_2px_0px_#0A0A0A]"
            >
              <ChevronLeft size={14} />
              <span>{t('admin.prev_page')}</span>
            </button>

            <span className="text-xs text-[#0A0A0A] font-mono font-black px-1">
              {t('admin.page_x_of_y', {
                current: activityPage + 1,
                total: userDetailData?.activities?.totalPages || 1
              })}
            </span>

            <button
              onClick={() => setActivityPage((prev) => prev + 1)}
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
