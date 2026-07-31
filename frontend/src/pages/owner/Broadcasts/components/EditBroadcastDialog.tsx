import React, { useState, useEffect } from 'react';
import { AlertTriangle, Loader2, X, User, Save } from 'lucide-react';
import { t } from '../../../../i18n/config';
import type { CampaignResponse } from '../../../../types';
import type { BotResponse } from '../../../../types/bot';
import { useUpdateCampaignMutation } from '../../../../hooks/broadcast/useBroadcastQueries';

interface EditBroadcastDialogProps {
  isOpen: boolean;
  onClose: () => void;
  campaign: CampaignResponse | null;
  bots: BotResponse[];
  botId: number;
}

export const EditBroadcastDialog: React.FC<EditBroadcastDialogProps> = ({
  isOpen,
  onClose,
  campaign,
  bots,
  botId,
}) => {
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [selectedAutomation, setSelectedAutomation] = useState<string>('ALL');
  const updateMut = useUpdateCampaignMutation(botId);

  useEffect(() => {
    if (campaign && isOpen) {
      setName(campaign.name);
      setMessage(campaign.message || '');
      setSelectedAutomation(campaign.targetAllBots ? 'ALL' : String(campaign.botId));
    }
  }, [campaign, isOpen]);

  if (!isOpen || !campaign) return null;

  const connectedBots = bots.filter((b) => b.hasTelegramToken);

  const selectedAutomationCount =
    selectedAutomation === 'ALL'
      ? connectedBots.reduce((acc, b) => acc + (b.totalUsers || 0), 0)
      : connectedBots.find((b) => String(b.id) === selectedAutomation)?.totalUsers || 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    updateMut.mutate(
      {
        campaignId: campaign.id,
        req: {
          name: name.trim(),
          message: message.trim(),
          filterType: campaign.filterType,
          filterValue: campaign.filterValue,
          nodes: campaign.nodes,
          edges: campaign.edges,
          botId: selectedAutomation === 'ALL' ? undefined : Number(selectedAutomation),
          targetAllBots: selectedAutomation === 'ALL',
        },
      },
      {
        onSuccess: () => {
          onClose();
        },
      }
    );
  };

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 cursor-pointer"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 cursor-default"
      >
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">{t('broadcast.dialog.edit_title')}</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-655 p-1.5 hover:bg-slate-50 rounded-xl transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {updateMut.error && (
            <div className="bg-rose-50 text-rose-700 px-4 py-3 rounded-2xl text-xs font-bold border border-rose-100 flex items-start gap-2">
              <AlertTriangle size={14} className="shrink-0 mt-0.5" />
              <span>{(updateMut.error as Error).message}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('broadcast.dialog.campaign_name')}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('broadcast.dialog.campaign_name_placeholder')}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-semibold text-slate-800"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('broadcast.dialog.automation')}</label>
            <select
              value={selectedAutomation}
              onChange={(e) => setSelectedAutomation(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all bg-white font-semibold text-slate-800"
            >
              <option value="ALL">{t('broadcast.dialog.all_automations')}</option>
              {connectedBots.map((b) => (
                <option key={b.id} value={String(b.id)}>
                  {b.name}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50/40 border border-indigo-100/50 rounded-xl text-xs font-semibold text-indigo-700 mt-1">
              <User size={13} className="text-indigo-500" />
              <span>
                {t('broadcast.dialog.subscribers_receive_desc', { count: selectedAutomationCount })}
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('broadcast.dialog.message_text')}</label>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t('broadcast.dialog.message_placeholder')}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none font-medium text-slate-700"
            />
          </div>
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-xl transition-all cursor-pointer"
            >
              {t('broadcast.dialog.cancel')}
            </button>
            <button
              type="submit"
              disabled={updateMut.isPending || !name.trim()}
              className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-sm cursor-pointer shadow-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updateMut.isPending ? (
                <>
                  <Loader2 size={12} className="animate-spin" />
                  <span>{t('broadcast.dialog.saving')}</span>
                </>
              ) : (
                <>
                  <Save size={12} />
                  <span>{t('broadcast.dialog.save_changes')}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
