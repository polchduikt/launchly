import React, { useState, useEffect } from 'react';
import { Copy, Check, CheckCircle, Loader2, HelpCircle } from 'lucide-react';
import { t } from '../../i18n/config';
import {
  useCreateIntegrationMutation,
  useDeleteIntegrationMutation,
} from '../../hooks/integration/useIntegrationQueries';
import type { IntegrationResponse } from '../../types';

interface HotmartCardProps {
  botId: number;
  integration?: IntegrationResponse;
  onOpenPricing?: () => void;
}

export const HotmartCard: React.FC<HotmartCardProps> = ({
  botId,
  integration,
}) => {
  const [hottok, setHottok] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const createMutation = useCreateIntegrationMutation();
  const deleteMutation = useDeleteIntegrationMutation();

  const webhookUrl = `${window.location.origin}/api/v1/integrations/hotmart/webhook?botId=${botId}`;

  useEffect(() => {
    if (integration) {
      setIsConnected(integration.active);
      if (integration.config && integration.config.hottok) {
        setHottok(integration.config.hottok);
      }
    } else {
      setIsConnected(false);
      setHottok('');
    }
    setErrorMsg('');
  }, [integration]);

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hottok.trim()) {
      setErrorMsg(t('settings.integrations.hotmart.error_hottok', 'Hottok token is required'));
      return;
    }

    setErrorMsg('');
    try {
      await createMutation.mutateAsync({
        name: 'Hotmart',
        type: 'HOTMART',
        botId,
        config: {
          hottok: hottok.trim(),
          syncOrders: true,
          syncLeads: true,
        },
      });
      setIsConnected(true);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err?.response?.data?.message || 'Failed to connect Hotmart');
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
    setHottok('');
    setErrorMsg('');
  };

  return (
    <div className="bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-3xl p-6 md:p-8 flex flex-col md:flex-row gap-6 md:items-start justify-between transition-all font-['JetBrains_Mono',monospace]">
      <div className="w-full md:w-1/4 shrink-0">
        <h3 className="font-['Anybody',sans-serif] font-black text-sm text-[#0A0A0A] uppercase tracking-tight leading-snug">
          {t('settings.integrations.hotmart.title', 'Hotmart Sales & Webhooks')}
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
          <svg className="w-12 h-12 text-[#FF5A00] fill-current" viewBox="0 0 27 37">
            <path d="M25.7756 17.3698C25.2893 15.6249 24.5666 13.9548 23.6276 12.4058H23.6296C23.6296 12.4058 22.7026 10.8678 22.3136 10.4028H22.3106C22.2146 10.2818 22.0216 10.4158 22.0956 10.5538C22.2046 10.7828 22.3036 11.0648 22.2346 11.3398C22.1206 11.6758 21.7456 11.9088 21.4006 11.7898C21.3051 11.7512 21.2186 11.6933 21.1466 11.6198C20.7936 11.2548 20.6096 10.6508 20.3806 9.8838C20.1746 9.2008 19.9196 8.35279 19.4596 7.43479C18.7116 5.94279 17.8266 5.25279 17.7906 5.22379C17.7686 5.20662 17.7416 5.19721 17.7137 5.19703C17.6859 5.19685 17.6587 5.20591 17.6366 5.2228C17.6142 5.23992 17.5976 5.26346 17.5891 5.29028C17.5805 5.31709 17.5803 5.34588 17.5886 5.3728C17.5926 5.3848 17.9646 6.61479 17.2466 7.54579C16.9606 7.91679 16.5256 8.1408 16.0186 8.1728C15.5086 8.2058 15.0036 8.0368 14.7006 7.7328C13.9496 6.9778 13.8616 5.63979 13.8756 4.90979C13.9226 2.47579 14.6576 0.770795 15.0406 0.209795C15.0567 0.185815 15.0649 0.157376 15.064 0.12849C15.0631 0.0996036 15.0532 0.071728 15.0356 0.048795C15.018 0.0265184 14.9936 0.0106996 14.9661 0.00382184C14.9385 -0.00305591 14.9095 -0.000603202 14.8836 0.010795C11.9096 1.2998 9.75456 3.50679 8.65356 6.38379C8.03456 8.09479 7.76456 8.8748 7.54556 9.3658C7.34356 9.8148 7.15656 10.0218 6.96556 10.1358C6.86056 10.1998 6.73256 10.2358 6.60056 10.2408C6.40656 10.2208 5.44656 10.0448 6.28256 8.4388C6.35156 8.3038 6.16856 8.1698 6.06656 8.2788L5.40856 9.0058C5.37923 9.0378 5.3499 9.0698 5.32056 9.1018L5.21156 9.2228C5.1929 9.24413 5.1759 9.2648 5.16056 9.2848C3.08056 11.6618 1.62756 14.7038 0.790564 17.5138C0.0405639 20.2138 -0.00643612 22.3708 0.000563879 23.1908L0.00156388 23.3728C0.00156388 27.0068 1.38356 30.4228 3.89256 32.9928C6.40156 35.5628 9.73956 36.9778 13.2876 36.9778C16.8356 36.9778 20.1736 35.5628 22.6826 32.9928C25.1926 30.4228 26.5736 27.0058 26.5736 23.3728C26.5736 21.0578 26.2756 19.1718 25.7706 17.3698H25.7756ZM13.2896 30.4168C9.49156 30.4168 6.41056 27.2648 6.41056 23.3738C6.41056 19.4828 9.49056 16.3298 13.2896 16.3298C17.0886 16.3298 20.1686 19.4838 20.1686 23.3738C20.1686 27.2638 17.0886 30.4168 13.2896 30.4168Z" />
          </svg>
        </div>

        <div className="flex-1 flex flex-col gap-2">
          <span className="font-black text-[#0A0A0A] text-sm uppercase">Hotmart</span>

          <div className="space-y-1 mt-1">
            <label className="flex items-center gap-1 text-[9px] font-black text-[#0A0A0A] uppercase tracking-wider select-none">
              <span>{t('settings.integrations.hotmart.webhook_url_label', 'Your Webhook Endpoint URL')}</span>
              <HelpCircle size={10} className="text-[#0A0A0A]" />
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={webhookUrl}
                className="w-full px-3 py-2 border-2 border-[#0A0A0A] rounded-xl text-[11px] font-mono font-bold bg-white text-[#0A0A0A] select-all focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCopyWebhook}
                className="p-2 border-2 border-[#0A0A0A] rounded-xl bg-white hover:bg-[#0A0A0A] hover:text-[#F2EBDD] transition-colors shrink-0 cursor-pointer"
                title="Copy Webhook URL"
              >
                {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
              </button>
            </div>
          </div>

          {isConnected ? (
            <div className="space-y-3 w-full mt-2">
              <div className="p-3 bg-white border-2 border-[#0A0A0A] rounded-xl text-xs font-bold text-[#0A0A0A]">
                <span className="text-slate-600 uppercase text-[10px] block">
                  {t('settings.integrations.hotmart.token_label', 'Hottok Token')}:
                </span>
                <span className="font-mono">••••••••••••••••</span>
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
                  <span>{t('settings.integrations.hotmart.token_label', 'Hottok Verification Token')}</span>
                </label>
                <input
                  type="password"
                  value={hottok}
                  onChange={(e) => setHottok(e.target.value)}
                  placeholder={t('settings.integrations.hotmart.token_placeholder', 'Paste your Hotmart Hottok')}
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
                <span>{t('settings.integrations.premium.connect', { name: 'Hotmart' })}</span>
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="w-full md:w-1/3 text-xs text-slate-700 leading-relaxed font-bold">
        {t('settings.integrations.hotmart.desc', 'Receive order and purchase notifications from Hotmart via webhook. Copy this endpoint URL to your Hotmart Webhook settings and enter your verification token.')}
      </div>
    </div>
  );
};
