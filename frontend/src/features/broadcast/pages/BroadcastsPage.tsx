import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueries } from '@tanstack/react-query';
import { useBotStore } from '../../../store/useBotStore';
import { t } from '../../../i18n';
import { ROUTES } from '../../../constants/routes';
import { DashboardLayout } from '../../../components/layouts/DashboardLayout';
import { useBotsQuery } from '../../bot/hooks/useBotsQuery';
import {
  useTagsQuery,
  useSendCampaignMutation,
  useDeleteCampaignMutation,
  useCancelScheduleMutation,
} from '../hooks/useBroadcastQueries';
import { getCampaignsApi } from '../api/broadcast';
import { useCreateBroadcastForm } from '../hooks/useCreateBroadcastForm';
import { StatusBadge, CreateBroadcastDialog, EditBroadcastDialog } from '../components';
import type { CampaignResponse } from '../types';
import { getFilterText } from '../utils/filterText';
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
} from 'lucide-react';

export const BroadcastsPage: React.FC = () => {
  const navigate = useNavigate();
  const activeBotId = useBotStore((state) => state.activeBotId);
  const { data: bots = [] } = useBotsQuery();

  const botId = activeBotId || (bots[0]?.id || 0);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<CampaignResponse | null>(null);

  const campaignQueries = useQueries({
    queries: bots.map((bot) => ({
      queryKey: ['campaigns', bot.id],
      queryFn: () => getCampaignsApi(bot.id),
      enabled: bots.length > 0,
    })),
  });

  const campaigns = useMemo(() => {
    return campaignQueries
      .flatMap((q) => q.data || [])
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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
    if (window.confirm(t('broadcasts.alert.send_confirm', { name }))) {
      sendCampaignMut.mutate({ botId: targetBotId, campaignId });
    }
  };
  const handleDeleteCampaign = (campaignId: number, targetBotId: number, name: string) => {
    if (window.confirm(t('broadcasts.alert.delete_confirm', { name }))) {
      deleteCampaignMut.mutate({ botId: targetBotId, campaignId });
    }
  };
  const handleCancelSchedule = (campaignId: number, targetBotId: number, name: string) => {
    if (window.confirm(t('broadcasts.alert.cancel_confirm', { name }))) {
      cancelScheduleMut.mutate({ botId: targetBotId, campaignId });
    }
  };

  if (bots.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[70vh] p-8 max-w-md mx-auto text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
            <Bell size={28} />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">{t('broadcasts.connect_bot_title')}</h1>
            <p className="text-sm text-slate-555">
              {t('broadcasts.connect_bot_desc')}
            </p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-md shadow-indigo-100 cursor-pointer"
          >
            {t('broadcasts.btn.go_home')}
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-slate-50 p-6 md:p-10 max-w-6xl mx-auto space-y-6 font-sans">
        <div className="flex items-center justify-between pb-6 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{t('broadcasts.title')}</h1>
            <p className="text-xs text-slate-550 font-semibold mt-1">
              {t('broadcasts.subtitle')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCreateOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-sm cursor-pointer shadow-indigo-100"
            >
              <Plus size={14} />
              <span>{t('broadcasts.btn.new')}</span>
            </button>
          </div>
        </div>

        {isCampaignsLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-indigo-600" size={32} />
          </div>
        ) : campaigns.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-10 md:p-16 shadow-sm text-center max-w-4xl mx-auto mt-6">
            <div className="relative w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm relative">
                <Bell size={36} />
              </div>
              <div className="absolute top-1 right-1 w-10 h-10 rounded-full bg-orange-100 border-2 border-white flex items-center justify-center text-orange-600 shadow-sm">
                <Flame size={20} className="fill-orange-600" />
              </div>
              <div className="absolute bottom-1 left-1 w-8 h-8 rounded-full bg-emerald-100 border-2 border-white flex items-center justify-center text-emerald-600 shadow-sm">
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
              </div>
            </div>

            <h2 className="text-lg font-bold text-slate-900 tracking-tight mb-2">{t('broadcasts.empty.title')}</h2>
            <p className="text-sm text-slate-550 max-w-md mx-auto mb-6 leading-relaxed">
              {t('broadcasts.empty.desc')}
            </p>

            <button
              onClick={() => setIsCreateOpen(true)}
              className="px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-md shadow-indigo-100 cursor-pointer"
            >
              {t('broadcasts.btn.new')}
            </button>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 text-[10px] font-extrabold uppercase tracking-wider">
                    <th className="py-3 px-4">{t('broadcasts.table.campaign_name')}</th>
                    <th className="py-3 px-4">{t('broadcasts.table.automation')}</th>
                    <th className="py-3 px-4">{t('broadcasts.table.target_audience')}</th>
                    <th className="py-3 px-4">{t('broadcasts.table.status')}</th>
                    <th className="py-3 px-4 w-44 text-center">{t('broadcasts.table.delivery_progress')}</th>
                    <th className="py-3 px-4">{t('broadcasts.table.created_date')}</th>
                    <th className="py-3 px-4 text-right">{t('broadcasts.table.action')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {campaigns.map((camp) => {
                    const campaignBot = bots.find((b) => b.id === camp.botId);
                    return (
                      <tr
                        key={camp.id}
                        onClick={() => navigate(ROUTES.BROADCAST_BUILDER.replace(':id', String(camp.id)))}
                        className="hover:bg-slate-50/50 transition-all cursor-pointer group"
                      >
                        <td className="py-4 px-4">
                          <div className="font-semibold text-sm text-slate-800 group-hover:text-indigo-600 transition-all">
                            {camp.name}
                          </div>
                          <div className="text-xs text-slate-400 truncate max-w-xs mt-0.5">
                            {camp.message}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-xs font-bold text-slate-550">
                          {campaignBot ? campaignBot.name : '—'}
                        </td>
                        <td className="py-4 px-4 text-sm text-slate-500 font-medium">
                          <span className="flex items-center gap-1.5">
                            <Filter size={12} className="text-slate-400" />
                            {getFilterText(camp.filterType, camp.filterValue)}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <StatusBadge status={camp.status} />
                        </td>
                        <td className="py-4 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="text-xs text-slate-550 font-bold mb-1.5">
                            {camp.status === 'SCHEDULED' && camp.sentCount === 0 && camp.totalCount === 0
                              ? t('broadcasts.table.pending')
                              : t('broadcasts.table.sent', { sent: camp.sentCount, total: camp.totalCount })}
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                camp.status === 'FAILED'
                                  ? 'bg-rose-500'
                                  : camp.status === 'IN_PROGRESS'
                                  ? 'bg-amber-400 animate-pulse'
                                  : camp.status === 'SCHEDULED'
                                  ? 'bg-slate-300'
                                  : 'bg-emerald-500'
                              }`}
                              style={{
                                width: camp.status === 'SCHEDULED' && camp.sentCount === 0 && camp.totalCount === 0
                                  ? '100%'
                                  : `${camp.totalCount > 0 ? (camp.sentCount / camp.totalCount) * 100 : 0}%`,
                              }}
                            />
                          </div>
                        </td>
                        <td className="py-4 px-4 text-xs text-slate-500 font-medium">
                          {new Date(camp.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="py-4 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            {camp.status === 'IN_PROGRESS' ? (
                              <Loader2 size={16} className="animate-spin text-slate-400 shrink-0" />
                            ) : (
                              <>
                                <button
                                  onClick={() => handleSendNow(camp.id, camp.botId, camp.name)}
                                  disabled={sendCampaignMut.isPending}
                                  title={t('broadcasts.tooltip.send_now')}
                                  className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border border-transparent hover:border-emerald-100 rounded-xl transition-all cursor-pointer shrink-0"
                                >
                                  <Play size={14} className="fill-current" />
                                </button>
                                <button
                                  onClick={() => setEditingCampaign(camp)}
                                  title={t('broadcasts.tooltip.edit')}
                                  className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 border border-transparent hover:border-indigo-100 rounded-xl transition-all cursor-pointer shrink-0"
                                >
                                  <Pencil size={14} />
                                </button>
                                {camp.status === 'SCHEDULED' && (
                                  <button
                                    onClick={() => handleCancelSchedule(camp.id, camp.botId, camp.name)}
                                    disabled={cancelScheduleMut.isPending}
                                    title={t('broadcasts.tooltip.cancel_schedule')}
                                    className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 border border-transparent hover:border-amber-100 rounded-xl transition-all cursor-pointer shrink-0"
                                  >
                                    <CalendarX size={14} />
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteCampaign(camp.id, camp.botId, camp.name)}
                                  disabled={deleteCampaignMut.isPending}
                                  title={t('broadcasts.tooltip.delete')}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-xl transition-all cursor-pointer shrink-0"
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
      </div>
    </DashboardLayout>
  );
};
