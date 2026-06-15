import React from 'react';
import { useIntegrationsQuery } from '../hooks/useIntegrationQueries';
import { GoogleSheetsCard } from './GoogleSheetsCard';
import { WebhookCard } from './WebhookCard';
import { Loader2, ShieldCheck } from 'lucide-react';

interface IntegrationsPanelProps {
  botId: number;
}

export const IntegrationsPanel: React.FC<IntegrationsPanelProps> = ({ botId }) => {
  const { data: integrations = [], isLoading } = useIntegrationsQuery();

  const googleIntegration = integrations.find(
    (i) => i.type === 'GOOGLE_SHEETS' && i.botId === botId
  );
  const webhookIntegration = integrations.find(
    (i) => i.type === 'WEBHOOK' && i.botId === botId
  );

  if (isLoading) {
    return (
      <div className="p-12 flex justify-center items-center">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <GoogleSheetsCard botId={botId} integration={googleIntegration} />

      <WebhookCard botId={botId} integration={webhookIntegration} />

      <div className="bg-slate-100/50 border border-slate-200 rounded-3xl p-6 flex gap-4 items-start select-none">
        <ShieldCheck size={24} className="text-indigo-600 mt-0.5 shrink-0" />
        <div className="space-y-1">
          <h4 className="font-bold text-xs text-slate-800">Security & Limits</h4>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            All database encryption handles Google API tokens securely. Launchly supports asynchronous dispatch buffers, ensuring third-party network outages do not cause bot message delays.
          </p>
        </div>
      </div>
    </div>
  );
};
