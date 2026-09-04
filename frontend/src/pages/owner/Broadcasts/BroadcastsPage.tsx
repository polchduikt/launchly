import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueries, useQuery } from '@tanstack/react-query';
import { useBotStore } from '../../../store/useBotStore';
import { t, getLanguage } from '../../../i18n/config';
import { ROUTES } from '../../../routes/paths';
import { DashboardLayout } from '../../../components/layout/DashboardLayout';
import { ConfirmModal } from '../../../components/ui/ConfirmModal';
import { useBotsQuery } from '../../../hooks/bot/useBotsQuery';
import {
  useTagsQuery,
  useSendCampaignMutation,
  useDeleteCampaignMutation,
  useCancelScheduleMutation,
} from '../../../hooks/broadcast/useBroadcastQueries';
import { getCampaignsApi } from '../../../api/broadcast';
import { getInstalledTemplatesApi } from '../../../api/templateApi';
import { useCreateBroadcastForm } from '../../../hooks/broadcast/useCreateBroadcastForm';
import { StatusBadge, CreateBroadcastDialog, EditBroadcastDialog } from './components';
import type { CampaignResponse } from '../../../types/broadcast';
import { getFilterText } from '../../../utils/filterText';
import {
  Bell,
  Flame,
  Plus,
  Loader2,
  Filter,
  Play,
  Trash2,
  Pencil,
  CalendarX,
  ShieldAlert,
  X,
} from 'lucide-react';

export const BroadcastsPage: React.FC = () => {
  const navigate = useNavigate();
  const activeBotId = useBotStore((state) => state.activeBotId);
  const { data: bots = [] } = useBotsQuery();
  const { data: installedTemplates = [] } = useQuery({
    queryKey: ['installed_templates'],
    queryFn: getInstalledTemplatesApi,
  });

  const botId = activeBotId || (bots[0]?.id || 0);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<CampaignResponse | null>(null);
  const [blockedDetailsCampaign, setBlockedDetailsCampaign] = useState<CampaignResponse | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    message: string;
    confirmLabel?: string;
    onConfirm: () => void;
  } | null>(null);

  const campaignQueries = useQueries({
    queries: bots.map((bot) => ({
      queryKey: ['campaigns', bot.id],
      queryFn: () => getCampaignsApi(bot.id),
      enabled: bots.length > 0,
    })),
  });

  const campaigns = useMemo(() => {
    const list = campaignQueries.flatMap((q) => q.data || []);
    const uniqueMap = new Map<number, CampaignResponse>();
    list.forEach((c) => uniqueMap.set(c.id, c));
    const uniqueList = Array.from(uniqueMap.values());
    return uniqueList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [campaignQueries]);

  const isCampaignsLoading = campaignQueries.some((q) => q.isLoading);
  const { data: tags = [] } = useTagsQuery(botId);
  const sendCampaignMut = useSendCampaignMutation();
  const { form, onSubmit, isPending: isCreating, error: createError } = useCreateBroadcastForm(
    botId,
    () => setIsCreateOpen(false)
  );
  const deleteCampaignMut = useDeleteCampaignMutation();
  const cancelScheduleMut = useCancelScheduleMutation();

  const handleSendNow = (campaignId: number, targetBotId: number, name: string) => {
    setConfirmDialog({
      title: 'Надіслати зараз',
      message: t('broadcasts.alert.send_confirm', { name }),
      confirmLabel: 'Надіслати',
      onConfirm: () => {
        sendCampaignMut.mutate({ botId: targetBotId, campaignId });
        setConfirmDialog(null);
      },
    });
  };
  const handleDeleteCampaign = (campaignId: number, targetBotId: number, name: string) => {
    setConfirmDialog({
      title: 'Видалити розсилку',
      message: t('broadcasts.alert.delete_confirm', { name }),
      confirmLabel: 'Видалити',
      onConfirm: () => {
        deleteCampaignMut.mutate({ botId: targetBotId, campaignId });
        setConfirmDialog(null);
      },
    });
  };
  const handleCancelSchedule = (campaignId: number, targetBotId: number, name: string) => {
    setConfirmDialog({
      title: 'Скасувати розклад',
      message: t('broadcasts.alert.cancel_schedule_confirm', { name }),
      confirmLabel: 'Скасувати розклад',
      onConfirm: () => {
        cancelScheduleMut.mutate({ botId: targetBotId, campaignId });
        setConfirmDialog(null);
      },
    });
  };

  const formatDateShort = (dateStr?: string | null) => {
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

  const formatScheduledDate = (dateStr?: string | null) => {
    if (!dateStr) return '';
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

  const translateBlockReason = (reason?: string | null) => {
    if (!reason) return '';
    const lang = getLanguage();
    const ukMap: Record<string, string> = {
      'Suspicious activity': 'Підозріла активність',
      'Violation of platform rules': 'Порушення правил платформи',
      'Spam or unauthorized bulk messaging': 'Спам або несанкціонована розсилка',
      'Other reason': 'Інша причина',
      'Підозріла активність': 'Підозріла активність',
      'Порушення правил платформи': 'Порушення правил платформи',
      'Спам або несанкціонована розсилка': 'Спам або несанкціонована розсилка',
      'Інша причина': 'Інша причина',
    };
    const enMap: Record<string, string> = {
      'Suspicious activity': 'Suspicious activity',
      'Violation of platform rules': 'Violation of platform rules',
      'Spam or unauthorized bulk messaging': 'Spam or unauthorized bulk messaging',
      'Other reason': 'Other reason',
      'Підозріла активність': 'Suspicious activity',
      'Порушення правил платформи': 'Violation of platform rules',
      'Спам або несанкціонована розсилка': 'Spam or unauthorized bulk messaging',
      'Інша причина': 'Other reason',
    };
    if (lang === 'uk') {
      return ukMap[reason] || t(reason) || reason;
    }
    return enMap[reason] || t(reason) || reason;
  };

  if (bots.length === 0 && installedTemplates.length === 0) {
    return (
      <DashboardLayout>
        <div className="h-full flex items-center justify-center p-8 text-center bg-[#F2EBDD]">
          <div className="max-w-md space-y-4 font-['JetBrains_Mono',monospace] bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-3xl p-10 shadow-[4px_4px_0px_#0A0A0A]">
            <div className="w-16 h-16 rounded-2xl bg-white border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] flex items-center justify-center mx-auto text-[#0A0A0A]">
              <Bell size={32} />
            </div>
            <p className="font-['Anybody',sans-serif] font-black text-[#0A0A0A] text-xl uppercase tracking-tight">
              {t('broadcasts.connect_bot_title')}
            </p>
            <p className="font-['Geist',sans-serif] text-xs text-[#0A0A0A]/70 font-semibold max-w-xs mx-auto leading-relaxed">
              {t('broadcasts.connect_bot_desc')}
            </p>
            <div className="pt-2">
              <button
                onClick={() => navigate('/connect-bot')}
                className="px-6 py-3 bg-[#0A0A0A] text-[#F2EBDD] font-['JetBrains_Mono',monospace] text-xs font-black uppercase tracking-wider border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] hover:bg-white hover:text-[#0A0A0A] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all cursor-pointer inline-flex items-center gap-2"
              >
                <Plus size={14} />
                <span>{t('connect_bot.btn_connect_existing', 'Connect Bot')}</span>
              </button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <ConfirmModal
        isOpen={!!confirmDialog}
        title={confirmDialog?.title ?? ''}
        message={confirmDialog?.message ?? ''}
        variant="danger"
        confirmLabel={confirmDialog?.confirmLabel ?? t('common.confirm')}
        cancelLabel={t('common.cancel')}
        onConfirm={() => confirmDialog?.onConfirm()}
        onCancel={() => setConfirmDialog(null)}
      />
      <div className="min-h-screen bg-[#F2EBDD] p-6 md:p-10 max-w-6xl mx-auto space-y-6 font-['Geist',sans-serif]">
        <div className="flex items-center justify-between pb-6 border-b-2 border-[#0A0A0A]">
          <div>
            <h1 className="font-['Anybody',sans-serif] text-2xl font-black text-[#0A0A0A] uppercase tracking-tight select-none">{t('broadcasts.title')}</h1>
            <p className="font-['JetBrains_Mono',monospace] text-xs text-slate-700 font-bold mt-1 uppercase">
              {t('broadcasts.subtitle')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCreateOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-black uppercase text-white bg-[#0A0A0A] hover:bg-[#2A2A2A] border-2 border-[#0A0A0A] rounded-xl transition-all cursor-pointer shadow-[2px_2px_0px_#0A0A0A] select-none"
            >
              <Plus size={14} />
              <span>{t('broadcasts.btn.new')}</span>
            </button>
          </div>
        </div>

        {isCampaignsLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-[#0A0A0A]" size={32} />
          </div>
        ) : campaigns.length === 0 ? (
          <div className="bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-3xl p-10 md:p-16 text-center max-w-4xl mx-auto mt-6">
            <div className="relative w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              <div className="w-16 h-16 rounded-2xl bg-white border-2 border-[#0A0A0A] flex items-center justify-center text-[#0A0A0A] relative">
                <Bell size={36} />
              </div>
              <div className="absolute top-1 right-1 w-10 h-10 rounded-full bg-amber-200 border-2 border-[#0A0A0A] flex items-center justify-center text-[#0A0A0A]">
                <Flame size={20} className="fill-[#0A0A0A]" />
              </div>
              <div className="absolute bottom-1 left-1 w-8 h-8 rounded-full bg-emerald-200 border-2 border-[#0A0A0A] flex items-center justify-center text-[#0A0A0A]">
                <span className="w-3 h-3 rounded-full bg-[#0A0A0A]" />
              </div>
            </div>

            <h2 className="font-['Anybody',sans-serif] text-xl font-black text-[#0A0A0A] uppercase tracking-tight mb-2">{t('broadcasts.empty.title')}</h2>
            <p className="font-['JetBrains_Mono',monospace] text-xs font-bold text-slate-700 max-w-md mx-auto mb-6 leading-relaxed">
              {t('broadcasts.empty.desc')}
            </p>

            <button
              onClick={() => setIsCreateOpen(true)}
              className="px-6 py-2.5 text-xs font-black uppercase font-['JetBrains_Mono',monospace] text-[#0A0A0A] bg-white border-2 border-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-[#F2EBDD] rounded-xl transition-all cursor-pointer"
            >
              {t('broadcasts.btn.new')}
            </button>
          </div>
        ) : (
          <div className="bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse font-['JetBrains_Mono',monospace]">
                <thead>
                  <tr className="border-b-2 border-[#0A0A0A] text-[#0A0A0A] text-[10px] font-black uppercase tracking-wider bg-white">
                    <th className="py-3 px-4">{t('broadcasts.table.campaign_name')}</th>
                    <th className="py-3 px-4">{t('broadcasts.table.automation')}</th>
                    <th className="py-3 px-4">{t('broadcasts.table.target_audience')}</th>
                    <th className="py-3 px-4">{t('broadcasts.table.status')}</th>
                    <th className="py-3 px-4 w-44 text-center">{t('broadcasts.table.delivery_progress')}</th>
                    <th className="py-3 px-4">{t('broadcasts.table.created_date')}</th>
                    <th className="py-3 px-4 text-right">{t('broadcasts.table.action')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#0A0A0A]/15 text-xs font-bold text-[#0A0A0A]">
                  {campaigns.map((camp) => {
                    const campaignBot = bots.find((b) => b.id === camp.botId);
                    const isBlocked = camp.blocked || camp.status === 'BLOCKED';
                    const templateNameTag = (camp as any).templateName || campaignBot?.templateName;
                    const isTemplateBot = !!templateNameTag || (campaignBot?.isTemplate ?? false) || ((camp as any).isTemplate ?? false);

                    return (
                      <tr
                        key={camp.id}
                        onClick={() => {
                          if (isBlocked) {
                            setBlockedDetailsCampaign(camp);
                            return;
                          }
                          navigate(ROUTES.BROADCAST_BUILDER.replace(':id', String(camp.id)));
                        }}
                        className={`transition-all ${
                          isBlocked
                            ? 'bg-rose-100/60 opacity-90 cursor-pointer'
                            : 'hover:bg-white/70 cursor-pointer group'
                        }`}
                      >
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-sm text-[#0A0A0A] group-hover:text-indigo-600 transition-all">
                              {camp.name}
                            </span>
                            {templateNameTag ? (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-black bg-slate-200 text-slate-800 border border-[#0A0A0A] uppercase shrink-0">
                                [{t('template.badge', 'ШАБЛОН')} {templateNameTag}]
                              </span>
                            ) : isTemplateBot ? (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-black bg-slate-200 text-slate-800 border border-[#0A0A0A] uppercase shrink-0">
                                [{t('template.badge', 'ШАБЛОН')}]
                              </span>
                            ) : null}
                          </div>
                          <div className="text-xs text-slate-700 font-semibold truncate max-w-xs mt-0.5">
                            {isBlocked
                              ? translateBlockReason(camp.blockReason)
                              : camp.message}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-xs font-extrabold text-[#0A0A0A]">
                          {camp.targetAllBots || !campaignBot
                            ? t('broadcast.dialog.all_automations', 'Усі автоматизації')
                            : campaignBot.name}
                        </td>
                        <td className="py-4 px-4 text-xs text-[#0A0A0A] font-bold">
                          <span className="flex items-center gap-1.5">
                            <Filter size={12} className="text-[#0A0A0A]" />
                            {getFilterText(camp.filterType, camp.filterValue)}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <StatusBadge status={isBlocked ? 'BLOCKED' : camp.status} />
                        </td>
                        <td className="py-4 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="text-xs text-[#0A0A0A] font-bold mb-1.5 whitespace-nowrap">
                            {camp.status === 'SCHEDULED'
                              ? `${t('status.scheduled') || 'Заплановано'} (${formatScheduledDate(camp.scheduledAt)})`
                              : t('broadcasts.table.sent', {
                                  sent: camp.sentCount || 0,
                                  total: camp.totalCount ?? (campaignBot?.totalUsers ?? 0),
                                })}
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                isBlocked
                                  ? 'bg-rose-400 opacity-60'
                                  : camp.status === 'FAILED'
                                  ? 'bg-rose-500'
                                  : camp.status === 'IN_PROGRESS'
                                  ? 'bg-amber-400 animate-pulse'
                                  : camp.status === 'SCHEDULED'
                                  ? 'bg-indigo-400'
                                  : 'bg-emerald-500'
                              }`}
                              style={{
                                width: camp.status === 'SCHEDULED'
                                  ? '100%'
                                  : `${camp.totalCount > 0 ? (camp.sentCount / camp.totalCount) * 100 : 0}%`,
                              }}
                            />
                          </div>
                        </td>
                        <td className="py-4 px-4 text-xs text-slate-500 font-medium">
                          {formatDateShort(camp.createdAt)}
                        </td>
                        <td className="py-4 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end space-x-1.5">
                            {isBlocked ? (
                              <button
                                onClick={() => setBlockedDetailsCampaign(camp)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold uppercase bg-rose-600 text-white hover:bg-rose-700 shadow-md shadow-rose-200 transition-all cursor-pointer select-none"
                              >
                                <ShieldAlert size={14} />
                                <span>{t('broadcast.details_btn') || 'Деталі'}</span>
                              </button>
                            ) : (
                              <>
                                {camp.status === 'SCHEDULED' ? (
                                  <button
                                    onClick={() => handleCancelSchedule(camp.id, camp.botId, camp.name)}
                                    disabled={isBlocked || cancelScheduleMut.isPending}
                                    title={t('broadcasts.tooltip.cancel_schedule')}
                                    className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 border border-transparent hover:border-amber-100 rounded-xl transition-all cursor-pointer shrink-0 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                                  >
                                    <CalendarX size={14} />
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleSendNow(camp.id, camp.botId, camp.name)}
                                    disabled={isBlocked || sendCampaignMut.isPending || camp.id < 0}
                                    title={t('broadcasts.tooltip.send_now')}
                                    className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 border border-transparent hover:border-emerald-100 rounded-xl transition-all cursor-pointer shrink-0 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                                  >
                                    <Play size={14} />
                                  </button>
                                )}
                                <button
                                  onClick={() => setEditingCampaign(camp)}
                                  disabled={isBlocked}
                                  title={t('broadcasts.tooltip.edit')}
                                  className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 border border-transparent hover:border-indigo-100 rounded-xl transition-all cursor-pointer shrink-0 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                                >
                                  <Pencil size={14} />
                                </button>
                                <button
                                  onClick={() => handleDeleteCampaign(camp.id, camp.botId, camp.name)}
                                  disabled={isBlocked || deleteCampaignMut.isPending || camp.id < 0}
                                  title={t('broadcasts.tooltip.delete')}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-xl transition-all cursor-pointer shrink-0 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <CreateBroadcastDialog
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          onSubmit={onSubmit}
          form={form}
          isCreating={isCreating}
          createError={createError}
          tags={tags}
          bots={bots}
        />
        <EditBroadcastDialog
          isOpen={editingCampaign !== null}
          onClose={() => setEditingCampaign(null)}
          campaign={editingCampaign}
          bots={bots}
          botId={editingCampaign?.botId || botId}
        />

        {blockedDetailsCampaign && (
          <div
            onClick={() => setBlockedDetailsCampaign(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 animate-in fade-in duration-150 select-none"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-5 animate-in zoom-in-95 duration-200"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 font-bold shrink-0">
                    <ShieldAlert size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 leading-snug">
                      {t('broadcast.blocked_modal_title') !== 'broadcast.blocked_modal_title' ? t('broadcast.blocked_modal_title') : 'Розсилка заблокована'}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      {blockedDetailsCampaign.name}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setBlockedDetailsCampaign(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-xl border-2 border-[#0A0A0A] bg-white text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-white transition-all cursor-pointer shadow-sm"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-4 text-xs font-semibold text-slate-600">
                <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl space-y-1.5">
                  <span className="text-[11px] font-bold text-rose-500 uppercase tracking-wider block">
                    {t('broadcast.block_reason_label') || 'Причина блокування'}
                  </span>
                  <p className="text-sm font-bold text-rose-950">
                    {translateBlockReason(blockedDetailsCampaign.blockReason)}
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setBlockedDetailsCampaign(null)}
                  className="w-full py-3 bg-[#0A0A0A] hover:bg-[#2A2A2A] text-[#F2EBDD] font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                >
                  {t('common.close') || 'Зрозуміло'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
};
