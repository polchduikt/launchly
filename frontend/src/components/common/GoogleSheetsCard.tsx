import React from 'react';
import {
   useDeleteIntegrationMutation,
} from '../../hooks/integration/useIntegrationQueries';
import { useAuthStore } from '../../store/useAuthStore';
import { SiGooglesheets } from '@icons-pack/react-simple-icons';
import type { IntegrationResponse } from '../../types/integration';
import { t } from '../../i18n/config';

interface GoogleSheetsCardProps {
  botId: number;
  integration: IntegrationResponse | undefined;
}

export const GoogleSheetsCard: React.FC<GoogleSheetsCardProps> = ({ botId, integration }) => {
  const deleteMut = useDeleteIntegrationMutation();

  const handleConnectGoogle = () => {
    const token = useAuthStore.getState().accessToken;
    window.location.href = `/api/v1/integrations/google/auth?botId=${botId}&token=${token}`;
  };

  const handleDelete = () => {
    if (integration) {
      deleteMut.mutate(integration.id);
    }
  };

  const isConnected = integration && integration.active;
  
  let connectedEmail = t('settings.integrations.google.reconnect_email');
  let hasConnectedEmail = false;
  if (integration?.config) {
    try {
      const parsedConfig = typeof integration.config === 'string' 
        ? JSON.parse(integration.config) 
        : integration.config;
      if (parsedConfig.email) {
        connectedEmail = parsedConfig.email;
        hasConnectedEmail = true;
      } else if (parsedConfig.accountName) {
        connectedEmail = parsedConfig.accountName;
        hasConnectedEmail = true;
      }
    } catch (e) {
      connectedEmail = t('settings.integrations.google.reconnect_email');
    }
  }

  return (
    <div className="bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-3xl p-6 md:p-8 flex flex-col md:flex-row gap-6 md:items-center justify-between font-['JetBrains_Mono',monospace]">
      
      <div className="w-full md:w-1/4 shrink-0">
        <h3 className="font-['Anybody',sans-serif] font-black text-sm text-[#0A0A0A] uppercase tracking-tight leading-snug">
          {t('settings.integrations.google.title')}
        </h3>
      </div>

      <div className="w-full md:w-2/5 flex gap-4 items-center">
        
        <div className="w-16 h-16 flex items-center justify-center shrink-0 text-[#0F9D58]">
          <SiGooglesheets size={48} />
        </div>

        <div className="flex-1 flex flex-wrap md:flex-nowrap items-center gap-4 md:gap-12">
          <div className="flex flex-col gap-0.5">
            <span className="font-black text-[#0A0A0A] text-sm uppercase">Google Sheets</span>
            {isConnected && (
              <div className="mt-1 space-y-0.5">
                <span className="block text-[9px] font-black text-slate-700 uppercase tracking-wider">
                  {t('settings.integrations.google.account_name')}
                </span>
                <span className="block text-xs font-bold text-[#0A0A0A]">
                  {connectedEmail}
                </span>
              </div>
            )}
          </div>
          
          {isConnected ? (
            <div className="flex gap-2 shrink-0">
              {!hasConnectedEmail && (
                <button
                  type="button"
                  onClick={handleConnectGoogle}
                  className="px-4 py-2 bg-emerald-200 border-2 border-[#0A0A0A] text-[#0A0A0A] text-xs font-black uppercase rounded-xl transition-all cursor-pointer select-none shrink-0"
                >
                  {t('settings.integrations.google.reconnect')}
                </button>
              )}
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteMut.isPending}
                className="px-4 py-2 bg-rose-200 border-2 border-[#0A0A0A] text-[#0A0A0A] text-xs font-black uppercase rounded-xl transition-all cursor-pointer select-none shrink-0"
              >
                {deleteMut.isPending ? t('settings.integrations.google.disconnecting') : t('settings.integrations.google.disconnect')}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleConnectGoogle}
              className="px-4 py-2 bg-white hover:bg-[#0A0A0A] hover:text-[#F2EBDD] border-2 border-[#0A0A0A] text-[#0A0A0A] text-xs font-black uppercase rounded-xl transition-all cursor-pointer select-none shrink-0"
            >
              {t('settings.integrations.google.connect', 'Connect')}
            </button>
          )}
        </div>
      </div>

      <div className="w-full md:w-1/3 text-xs text-slate-700 leading-relaxed font-bold">
        {t('settings.integrations.google.desc')}{' '}
        <a href="https://google.com" target="_blank" rel="noopener noreferrer" className="text-indigo-650 font-bold hover:underline cursor-pointer">
          {t('settings.integrations.google.learn_more')}
        </a>
      </div>
    </div>
  );
};
