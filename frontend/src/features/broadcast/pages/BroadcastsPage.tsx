import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBotStore } from '../../../store/useBotStore';
import { ROUTES } from '../../../constants/routes';
import { DashboardLayout } from '../../../components/layouts/DashboardLayout';
import {
  useCampaignsQuery,
  useTagsQuery,
  useSendCampaignMutation,
} from '../hooks/useBroadcastQueries';
import { useCreateBroadcastForm } from '../hooks/useCreateBroadcastForm';
import { StatusBadge, CreateBroadcastDialog } from '../components';
import { getFilterText } from '../utils/filterText';
import {
  Bell,
  Flame,
  Plus,
  Loader2,
  Filter,
  Play,
} from 'lucide-react';

export const BroadcastsPage: React.FC = () => {
  const navigate = useNavigate();
  const activeBotId = useBotStore((state) => state.activeBotId);
  const botId = activeBotId || 0;
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { data: campaigns = [], isLoading: isCampaignsLoading } = useCampaignsQuery(botId);
  const { data: tags = [] } = useTagsQuery(botId);
  const sendCampaignMut = useSendCampaignMutation(botId);
  const { form, onSubmit, isPending: isCreating, error: createError } = useCreateBroadcastForm(
    botId,
    () => setIsCreateOpen(false)
  );
  const handleSendNow = (campaignId: number, name: string) => {
    if (window.confirm(`Are you sure you want to send the broadcast "${name}" now?`)) {
      sendCampaignMut.mutate(campaignId);
    }
  };

  if (!activeBotId) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[70vh] p-8 max-w-md mx-auto text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
            <Bell size={28} />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">Select a Bot first</h1>
            <p className="text-sm text-slate-550">
              Please select or connect a Telegram bot in the dashboard home page to manage campaigns.
            </p>
          </div>
          <button
            onClick={() => navigate(ROUTES.HOME)}
            className="px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-md shadow-indigo-100 cursor-pointer"
          >
            Go to Home
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
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Broadcasts</h1>
            <p className="text-xs text-slate-550 font-semibold mt-1">
              Send bulk messages and campaigns to your segmented subscribers.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCreateOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-sm cursor-pointer shadow-indigo-100"
            >
              <Plus size={14} />
              <span>New Broadcast</span>
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

            <h2 className="text-lg font-bold text-slate-900 tracking-tight mb-2">Create your first Broadcast</h2>
            <p className="text-sm text-slate-500 max-w-md mx-auto mb-6 leading-relaxed">
              Engage your contacts by sending your Broadcasts immediately or scheduling it on a particular date and time.
            </p>

            <button
              onClick={() => setIsCreateOpen(true)}
              className="px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-md shadow-indigo-100 cursor-pointer"
            >
              New Broadcast
            </button>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 text-[10px] font-extrabold uppercase tracking-wider">
                    <th className="py-3 px-4">Campaign Name</th>
                    <th className="py-3 px-4">Target Audience</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 w-44 text-center">Delivery Progress</th>
                    <th className="py-3 px-4">Created Date</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {campaigns.map((camp) => (
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
                          {camp.sentCount} / {camp.totalCount} sent
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              camp.status === 'FAILED'
                                ? 'bg-rose-500'
                                : camp.status === 'IN_PROGRESS'
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{
                              width: `${camp.totalCount > 0 ? (camp.sentCount / camp.totalCount) * 100 : 0}%`,
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
                        {camp.status === 'DRAFT' && (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => navigate(ROUTES.BROADCAST_BUILDER.replace(':id', String(camp.id)))}
                              className="px-3 py-1.5 text-xs font-bold text-indigo-600 hover:bg-indigo-50 border border-indigo-200 rounded-xl transition-all cursor-pointer"
                            >
                              Edit Flow
                            </button>
                            <button
                              onClick={() => handleSendNow(camp.id, camp.name)}
                              disabled={sendCampaignMut.isPending}
                              className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-sm cursor-pointer shadow-emerald-100"
                            >
                              <Play size={10} className="fill-current" />
                              Send Now
                            </button>
                          </div>
                        )}
                        {camp.status === 'IN_PROGRESS' && (
                          <Loader2 size={16} className="animate-spin text-slate-400 ml-auto" />
                        )}
                      </td>
                    </tr>
                  ))}
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
        />
      </div>
    </DashboardLayout>
  );
};
