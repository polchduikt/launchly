import React, { useState, useEffect } from 'react';
import { HelpCircle, CheckCircle } from 'lucide-react';
import { t } from '../../i18n/config';
import {
  useCreateIntegrationMutation,
  useDeleteIntegrationMutation,
} from '../../hooks/integration/useIntegrationQueries';

import type { IntegrationResponse } from '../../types';

interface PremiumIntegrationCardProps {
  title: string;
  name: string;
  description: string;
  logo: React.ReactNode;
  hasApiSecret?: boolean;
  stepText?: string;
  placeholder?: string;
  onUpgrade: () => void;
  botId: number;
  integration?: IntegrationResponse;
}

export const PremiumIntegrationCard: React.FC<PremiumIntegrationCardProps> = ({
  title,
  name,
  description,
  logo,
  hasApiSecret = false,
  stepText,
  placeholder,
  onUpgrade,
  botId,
  integration,
}) => {
  const [apiKey, setApiKey] = useState('');
  const [isConnected, setIsConnected] = useState(false);

  const createMutation = useCreateIntegrationMutation();
  const deleteMutation = useDeleteIntegrationMutation();

  useEffect(() => {
    if (integration) {
      setIsConnected(integration.active);
      if (integration.config && 'apiKey' in integration.config && integration.config.apiKey) {
        setApiKey(integration.config.apiKey);
      }
    } else {
      setIsConnected(false);
      setApiKey('');
    }
  }, [integration]);

  const handleConnect = async () => {
    if (hasApiSecret) {
      if (apiKey.trim()) {
        try {
          const typeStr = name.toUpperCase().replace(/\s+/g, '_') as IntegrationResponse['type'];
          await createMutation.mutateAsync({
            name: name,
            type: typeStr,
            botId: botId,
            config: { apiKey: apiKey.trim() },
          });
          setIsConnected(true);
        } catch (err) {
          console.error(err);
        }
      } else {
        onUpgrade();
      }
    } else {
      try {
        const typeStr = name.toUpperCase().replace(/\s+/g, '_') as IntegrationResponse['type'];
        await createMutation.mutateAsync({
          name: name,
          type: typeStr,
          botId: botId,
          config: {},
        });
        setIsConnected(true);
      } catch (err) {
        console.error(err);
      }
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
  };

  return (
    <div className="bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-3xl p-6 md:p-8 flex flex-col md:flex-row gap-6 md:items-center justify-between transition-all font-['JetBrains_Mono',monospace]">
      <div className="w-full md:w-1/4 shrink-0">
        <h3 className="font-['Anybody',sans-serif] font-black text-sm text-[#0A0A0A] uppercase tracking-tight leading-snug">
          {title}
        </h3>
        {isConnected && (
          <div className="mt-2.5 flex items-center gap-1.5 text-[#0A0A0A] font-black text-xs">
            <CheckCircle size={14} className="shrink-0 text-emerald-700" />
            <span>{t('settings.integrations.premium.connected')}</span>
          </div>
        )}
      </div>

      <div className="w-full md:w-2/5 flex gap-4 items-center">
        <div className="w-16 h-16 flex items-center justify-center shrink-0">
          {logo}
        </div>

        <div className="flex-1 flex flex-col gap-0.5">
          <span className="font-black text-[#0A0A0A] text-sm uppercase">{name}</span>

          {hasApiSecret ? (
            <div className="mt-2.5 space-y-2.5 w-full">
              {stepText && !isConnected && (
                <div className="flex flex-col select-none">
                  <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider leading-none">
                    {t('settings.integrations.premium.step1')}
                  </span>
                  <span className="text-xs font-bold text-[#0A0A0A] mt-0.5">{stepText}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="flex items-center gap-1 text-[9px] font-black text-[#0A0A0A] uppercase tracking-wider select-none">
                  <span>{t('settings.integrations.premium.api_secret')}</span>
                  <HelpCircle size={10} className="text-[#0A0A0A] cursor-help" />
                </label>
                <input
                  type="password"
                  value={isConnected ? '••••••••••••••••' : apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  disabled={isConnected}
                  placeholder={placeholder || t('settings.integrations.premium.api_secret')}
                  className="w-full px-3.5 py-2 border-2 border-[#0A0A0A] rounded-xl text-xs focus:outline-none disabled:bg-slate-100 disabled:text-slate-500 font-bold bg-white text-[#0A0A0A]"
                />
              </div>

              {isConnected ? (
                <button
                  type="button"
                  onClick={handleDisconnect}
                  className="w-full px-4 py-2 border-2 border-[#0A0A0A] bg-rose-200 hover:bg-rose-300 text-[#0A0A0A] text-xs font-black uppercase rounded-xl transition-all cursor-pointer select-none text-center"
                >
                  {t('settings.integrations.premium.disconnect')}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleConnect}
                  className="w-full px-4 py-2 border-2 border-[#0A0A0A] bg-white hover:bg-[#0A0A0A] hover:text-[#F2EBDD] text-[#0A0A0A] text-xs font-black uppercase rounded-xl transition-all cursor-pointer select-none text-center"
                >
                  {t('settings.integrations.premium.connect', { name })}
                </button>
              )}
            </div>
          ) : (
            <div className="mt-2.5 w-full space-y-2">
              {stepText && !isConnected && (
                <div className="flex flex-col select-none mb-1">
                  <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider leading-none">
                    {t('settings.integrations.premium.step1')}
                  </span>
                  <span className="text-xs font-bold text-[#0A0A0A] mt-0.5">{stepText}</span>
                </div>
              )}
              {isConnected ? (
                <button
                  type="button"
                  onClick={handleDisconnect}
                  className="w-full px-4 py-2 border-2 border-[#0A0A0A] bg-rose-200 hover:bg-rose-300 text-[#0A0A0A] text-xs font-black uppercase rounded-xl transition-all cursor-pointer select-none text-center"
                >
                  {t('settings.integrations.premium.disconnect')}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleConnect}
                  className="w-full px-4 py-2 border-2 border-[#0A0A0A] bg-white hover:bg-[#0A0A0A] hover:text-[#F2EBDD] text-[#0A0A0A] text-xs font-black uppercase rounded-xl transition-all cursor-pointer select-none text-center"
                >
                  {t('settings.integrations.premium.connect', { name })}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="w-full md:w-1/3 text-xs text-slate-700 leading-relaxed font-bold">
        {description}
      </div>
    </div>
  );
};
