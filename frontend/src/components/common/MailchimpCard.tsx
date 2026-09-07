import React, { useState, useEffect } from 'react';
import { HelpCircle, CheckCircle, Loader2 } from 'lucide-react';
import { SiMailchimp } from '@icons-pack/react-simple-icons';
import { t } from '../../i18n/config';
import {
  useCreateIntegrationMutation,
  useDeleteIntegrationMutation,
} from '../../hooks/integration/useIntegrationQueries';
import type { IntegrationResponse } from '../../types';

interface MailchimpCardProps {
  botId: number;
  integration?: IntegrationResponse;
  onOpenPricing?: () => void;
}

export const MailchimpCard: React.FC<MailchimpCardProps> = ({
  botId,
  integration,
}) => {
  const [apiKey, setApiKey] = useState('');
  const [listId, setListId] = useState('');
  const [tag, setTag] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const createMutation = useCreateIntegrationMutation();
  const deleteMutation = useDeleteIntegrationMutation();

  useEffect(() => {
    if (integration) {
      setIsConnected(integration.active);
      if (integration.config) {
        setApiKey(integration.config.apiKey || '');
        setListId(integration.config.listId || '');
        if (Array.isArray(integration.config.tags) && integration.config.tags.length > 0) {
          setTag(integration.config.tags.join(', '));
        }
      }
    } else {
      setIsConnected(false);
      setApiKey('');
      setListId('');
      setTag('');
    }
    setErrorMsg('');
  }, [integration]);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) {
      setErrorMsg(t('settings.integrations.mailchimp.error_api_key', 'API Key is required'));
      return;
    }
    if (!listId.trim()) {
      setErrorMsg(t('settings.integrations.mailchimp.error_list_id', 'Audience / List ID is required'));
      return;
    }

    setErrorMsg('');
    try {
      const tagsArray = tag
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      await createMutation.mutateAsync({
        name: 'Mailchimp',
        type: 'MAILCHIMP',
        botId,
        config: {
          apiKey: apiKey.trim(),
          listId: listId.trim(),
          tags: tagsArray.length > 0 ? tagsArray : undefined,
        },
      });
      setIsConnected(true);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err?.response?.data?.message || 'Failed to connect Mailchimp');
    }
  };

  const handleDisconnect = async () => {
    if (integration && integration.id) {
      try {
        await deleteMutation.mutateAsync(integration.id);
      } catch (err) {
        console.error(err);
      }
    }
    setIsConnected(false);
    setApiKey('');
    setListId('');
    setTag('');
    setErrorMsg('');
  };

  return (
    <div className="bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-3xl p-6 md:p-8 flex flex-col md:flex-row gap-6 md:items-start justify-between transition-all font-['JetBrains_Mono',monospace]">
      <div className="w-full md:w-1/4 shrink-0">
        <h3 className="font-['Anybody',sans-serif] font-black text-sm text-[#0A0A0A] uppercase tracking-tight leading-snug">
          {t('settings.integrations.mailchimp.title', 'Mailchimp Email Marketing')}
        </h3>
        {isConnected && (
          <div className="mt-2.5 flex items-center gap-1.5 text-[#0A0A0A] font-black text-xs">
            <CheckCircle size={14} className="shrink-0 text-emerald-700" />
            <span>{t('settings.integrations.premium.connected', 'Connected')}</span>
          </div>
        )}
      </div>

      <div className="w-full md:w-2/5 flex gap-4 items-start">
        <div className="w-16 h-16 flex items-center justify-center shrink-0 pt-1">
          <SiMailchimp className="w-12 h-12 text-black" />
        </div>

        <div className="flex-1 flex flex-col gap-2">
          <span className="font-black text-[#0A0A0A] text-sm uppercase">Mailchimp</span>

          {isConnected ? (
            <div className="space-y-3 w-full mt-2">
              <div className="p-3 bg-white border-2 border-[#0A0A0A] rounded-xl text-xs font-bold text-[#0A0A0A] space-y-1">
                <div>
                  <span className="text-slate-600 uppercase text-[10px] block">
                    {t('settings.integrations.mailchimp.audience_id', 'Audience ID')}:
                  </span>
                  <span className="font-mono">{listId || '••••••'}</span>
                </div>
                {tag && (
                  <div>
                    <span className="text-slate-600 uppercase text-[10px] block">
                      {t('settings.integrations.mailchimp.tags_label', 'Tags')}:
                    </span>
                    <span>{tag}</span>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleDisconnect}
                disabled={deleteMutation.isPending}
                className="w-full px-4 py-2 border-2 border-[#0A0A0A] bg-rose-200 hover:bg-rose-300 text-[#0A0A0A] text-xs font-black uppercase rounded-xl transition-all cursor-pointer select-none text-center flex items-center justify-center gap-2"
              >
                {deleteMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                <span>{t('settings.integrations.premium.disconnect', 'Disconnect')}</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleConnect} className="space-y-2.5 w-full mt-1">
              <div className="space-y-1">
                <label className="flex items-center gap-1 text-[9px] font-black text-[#0A0A0A] uppercase tracking-wider select-none">
                  <span>{t('settings.integrations.mailchimp.api_key_label', 'API Key')}</span>
                  <HelpCircle size={10} className="text-[#0A0A0A]" />
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={t('settings.integrations.mailchimp.api_key_placeholder', 'md5key-us21')}
                  className="w-full px-3.5 py-2 border-2 border-[#0A0A0A] rounded-xl text-xs font-bold bg-white text-[#0A0A0A] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="flex items-center gap-1 text-[9px] font-black text-[#0A0A0A] uppercase tracking-wider select-none">
                  <span>{t('settings.integrations.mailchimp.audience_id', 'Audience / List ID')}</span>
                </label>
                <input
                  type="text"
                  value={listId}
                  onChange={(e) => setListId(e.target.value)}
                  placeholder={t('settings.integrations.mailchimp.list_placeholder', 'e.g. 3a89e92bc4')}
                  className="w-full px-3.5 py-2 border-2 border-[#0A0A0A] rounded-xl text-xs font-bold bg-white text-[#0A0A0A] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="flex items-center gap-1 text-[9px] font-black text-[#0A0A0A] uppercase tracking-wider select-none">
                  <span>{t('settings.integrations.mailchimp.tags_label', 'Default Tags (Optional, comma-separated)')}</span>
                </label>
                <input
                  type="text"
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  placeholder="launchly, telegram-lead"
                  className="w-full px-3.5 py-2 border-2 border-[#0A0A0A] rounded-xl text-xs font-bold bg-white text-[#0A0A0A] focus:outline-none"
                />
              </div>

              {errorMsg && (
                <p className="text-[10px] font-black text-rose-600 uppercase tracking-wider">
                  {errorMsg}
                </p>
              )}

              <button
                type="submit"
                disabled={createMutation.isPending}
                className="w-full px-4 py-2.5 border-2 border-[#0A0A0A] bg-white hover:bg-[#0A0A0A] hover:text-[#F2EBDD] text-[#0A0A0A] text-xs font-black uppercase rounded-xl transition-all cursor-pointer select-none text-center flex items-center justify-center gap-2"
              >
                {createMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                <span>{t('settings.integrations.premium.connect', { name: 'Mailchimp' })}</span>
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="w-full md:w-1/3 text-xs text-slate-700 leading-relaxed font-bold">
        {t('settings.integrations.mailchimp.desc', 'Automatically sync captured emails and CRM leads to your Mailchimp audience and trigger newsletter flows.')}
      </div>
    </div>
  );
};
