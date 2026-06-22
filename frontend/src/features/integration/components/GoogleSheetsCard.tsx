import React from 'react';
import {
  useDeleteIntegrationMutation,
} from '../hooks/useIntegrationQueries';
import { useAuthStore } from '../../../store/useAuthStore';
import { FileSpreadsheet } from 'lucide-react';
import type { IntegrationResponse } from '../types';

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
  
  let connectedEmail = 'Reconnect to show email';
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
      connectedEmail = 'Reconnect to show email';
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row gap-6 md:items-start justify-between">
      
      <div className="w-full md:w-1/4 shrink-0">
        <h3 className="font-extrabold text-sm text-slate-800 tracking-tight leading-snug">
          Connect Google Sheets Account
        </h3>
      </div>

      
      <div className="w-full md:w-2/5 flex gap-4 items-start">
        
        <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 shadow-sm text-emerald-600">
          <FileSpreadsheet size={24} />
        </div>

        <div className="flex flex-col gap-0.5">
          <span className="font-bold text-slate-800 text-sm">Google Sheets</span>
          
          {isConnected ? (
            <div className="mt-2 space-y-1">
              <span className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">
                Google Sheets Account Name
              </span>
              <span className="block text-xs font-bold text-slate-700">
                {connectedEmail}
              </span>
              <div className="mt-3.5 flex flex-wrap gap-2">
                {!hasConnectedEmail && (
                  <button
                    type="button"
                    onClick={handleConnectGoogle}
                    className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 text-emerald-700 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm select-none"
                  >
                    Reconnect
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleteMut.isPending}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm select-none"
                >
                  {deleteMut.isPending ? 'Disconnecting...' : 'Disconnect'}
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleConnectGoogle}
              className="mt-3 px-4 py-2 border border-slate-250 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm select-none"
            >
              Connect Google Sheets Account
            </button>
          )}
        </div>
      </div>

      
      <div className="w-full md:w-1/3 text-xs text-slate-400 leading-relaxed font-medium">
        The integration provides you with an ability to save customers data from Launchly bot to Google Sheets.{' '}
        <a href="https://google.com" target="_blank" rel="noopener noreferrer" className="text-indigo-650 font-bold hover:underline cursor-pointer">
          Learn more
        </a>
      </div>
    </div>
  );
};
