import React, { useState, useEffect } from 'react';
import { HelpCircle, CheckCircle } from 'lucide-react';
import { t } from '../../../i18n';
import {
  useCreateIntegrationMutation,
  useDeleteIntegrationMutation
} from '../hooks/useIntegrationQueries';

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
  integration?: any;
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
  const normalizedName = name.toLowerCase().replace(/\s+/g, '_');
  const storageKey = hasApiSecret 
    ? `launchly_key_${normalizedName}`
    : `launchly_connected_${normalizedName}`;

  const [apiKey, setApiKey] = useState('');
  const [isConnected, setIsConnected] = useState(false);

  const createMutation = useCreateIntegrationMutation();
  const deleteMutation = useDeleteIntegrationMutation();

  useEffect(() => {
    if (integration) {
      setIsConnected(integration.active);
      if (integration.config && integration.config.apiKey) {
        setApiKey(integration.config.apiKey);
        localStorage.setItem(storageKey, integration.config.apiKey);
      }
    } else {
      const value = localStorage.getItem(storageKey);
      if (value) {
        setIsConnected(true);
        if (hasApiSecret) {
          setApiKey(value);
        }
      } else {
        setIsConnected(false);
        setApiKey('');
      }
    }
  }, [integration, storageKey, hasApiSecret]);

  const handleConnect = async () => {
    if (hasApiSecret) {
      if (apiKey.trim()) {
        try {
          const typeStr = name.toUpperCase().replace(/\s+/g, '_');
          await createMutation.mutateAsync({
            name: name,
            type: typeStr as any,
            botId: botId,
            config: { apiKey: apiKey.trim() } as any
          });
          localStorage.setItem(storageKey, apiKey.trim());
          setIsConnected(true);
        } catch (err) {
          console.error(err);
        }
      } else {
        onUpgrade();
      }
    } else {
      try {
        const typeStr = name.toUpperCase().replace(/\s+/g, '_');
        await createMutation.mutateAsync({
          name: name,
          type: typeStr as any,
          botId: botId,
          config: {} as any
        });
        localStorage.setItem(storageKey, 'true');
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
    localStorage.removeItem(storageKey);
    setIsConnected(false);
    setApiKey('');
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row gap-6 md:items-center justify-between transition-all">
      <div className="w-full md:w-1/4 shrink-0">
        <h3 className="font-extrabold text-sm text-slate-800 tracking-tight leading-snug">
          {title}
        </h3>
        {isConnected && (
          <div className="mt-2.5 flex items-center gap-1.5 text-emerald-600 font-extrabold text-xs">
            <CheckCircle size={13} className="shrink-0" />
            <span>{t('settings.integrations.premium.connected')}</span>
          </div>
        )}
      </div>

      <div className="w-full md:w-2/5 flex gap-4 items-center">
        <div className="w-16 h-16 flex items-center justify-center shrink-0">
          {logo}
        </div>

        <div className="flex-1 flex flex-col gap-0.5">
          <span className="font-bold text-slate-800 text-sm">{name}</span>
          
          {hasApiSecret ? (
            <div className="mt-2.5 space-y-2.5 w-full">
              {stepText && !isConnected && (
                <div className="flex flex-col select-none">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider leading-none">{t('settings.integrations.premium.step1')}</span>
                  <span className="text-xs font-bold text-slate-500 mt-0.5">{stepText}</span>
                </div>
              )}
              
              <div className="space-y-1">
                <label className="flex items-center gap-1 text-[9px] font-extrabold text-slate-450 uppercase tracking-wider select-none">
                  <span>{t('settings.integrations.premium.api_secret')}</span>
                  <HelpCircle size={10} className="text-slate-400 cursor-help" />
                </label>
                <input
                  type="password"
                  value={isConnected ? '••••••••••••••••' : apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  disabled={isConnected}
                  placeholder={placeholder || t('settings.integrations.premium.api_secret')}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500 disabled:bg-slate-50 disabled:text-slate-400 transition-all font-semibold bg-slate-50/50"
                />
              </div>

              {isConnected ? (
                <button
                  type="button"
                  onClick={handleDisconnect}
                  className="w-full px-4 py-2 border border-rose-200 hover:bg-rose-50 text-rose-600 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm select-none text-center"
                >
                  {t('settings.integrations.premium.disconnect')}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleConnect}
                  className="w-full px-4 py-2 border border-slate-250 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm select-none text-center"
                >
                  {t('settings.integrations.premium.connect', { name })}
                </button>
              )}
            </div>
          ) : (
            <div className="mt-2.5 w-full space-y-2">
              {stepText && !isConnected && (
                <div className="flex flex-col select-none mb-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider leading-none">{t('settings.integrations.premium.step1')}</span>
                  <span className="text-xs font-bold text-slate-500 mt-0.5">{stepText}</span>
                </div>
              )}
              {isConnected ? (
                <button
                  type="button"
                  onClick={handleDisconnect}
                  className="w-full px-4 py-2 border border-rose-200 hover:bg-rose-50 text-rose-600 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm select-none text-center"
                >
                  {t('settings.integrations.premium.disconnect')}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleConnect}
                  className="w-full px-4 py-2 border border-slate-250 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm select-none text-center"
                >
                  {t('settings.integrations.premium.connect', { name })}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="w-full md:w-1/3 text-xs text-slate-400 leading-relaxed font-medium">
        {description}
      </div>
    </div>
  );
};
