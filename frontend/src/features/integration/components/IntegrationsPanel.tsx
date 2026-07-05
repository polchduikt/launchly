import React from 'react';
import { useIntegrationsQuery } from '../hooks/useIntegrationQueries';
import { GoogleSheetsCard } from './GoogleSheetsCard';
import { Loader2 } from 'lucide-react';

interface IntegrationsPanelProps {
  botId: number;
}

export const IntegrationsPanel: React.FC<IntegrationsPanelProps> = ({ botId }) => {
  const { data: integrations = [], isLoading } = useIntegrationsQuery();

  const googleIntegration = integrations.find(
    (i) => i.type === 'GOOGLE_SHEETS' && i.botId === botId
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
    </div>
  );
};
