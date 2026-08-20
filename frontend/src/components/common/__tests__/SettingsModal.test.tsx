import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SettingsModal } from '../SettingsModal';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={qc}>
    <MemoryRouter>
      {children}
    </MemoryRouter>
  </QueryClientProvider>
);

vi.mock('../../../store/useBotStore', () => ({
  useBotStore: (selector: any) => selector ? selector({ activeBotId: 1 }) : { activeBotId: 1 },
}));

vi.mock('../../../hooks/bot/useBotsQuery', () => ({
  useBotsQuery: () => ({ data: [{ id: 1 }] }),
}));

vi.mock('../../../pages/owner/FlowBuilder/components/GeneralPanel', () => ({ GeneralPanel: () => <div data-testid="general-panel" /> }));
vi.mock('../../../pages/owner/FlowBuilder/components/NotificationsPanel', () => ({ NotificationsPanel: () => <div data-testid="notifications-panel" /> }));
vi.mock('../../../pages/owner/FlowBuilder/components/TelegramSettingsPanel', () => ({ TelegramSettingsPanel: () => <div data-testid="telegram-panel" /> }));
vi.mock('../../../pages/owner/FlowBuilder/components/DisplayPanel', () => ({ DisplayPanel: () => <div data-testid="display-panel" /> }));
vi.mock('../../../pages/owner/FlowBuilder/components/TeamMembersPanel', () => ({ TeamMembersPanel: () => <div data-testid="team-members-panel" /> }));
vi.mock('../../../pages/owner/FlowBuilder/components/UserFieldsPanel', () => ({ UserFieldsPanel: () => <div data-testid="user-fields-panel" /> }));
vi.mock('../../../pages/owner/FlowBuilder/components/TagsSettingsPanel', () => ({ TagsSettingsPanel: () => <div data-testid="tags-settings-panel" /> }));
vi.mock('../IntegrationsPanel', () => ({ IntegrationsPanel: () => <div data-testid="integrations-panel" /> }));
vi.mock('../SubscriptionsPanel', () => ({ SubscriptionsPanel: () => <div data-testid="subscriptions-panel" /> }));
vi.mock('../PaymentsPanel', () => ({ PaymentsPanel: () => <div data-testid="payments-panel" /> }));

vi.mock('../../../i18n/config', () => ({
  t: (k: string, fb?: string) => fb || k,
  useTranslation: () => ({ t: (k: string, fb?: string) => fb || k }),
}));

describe('SettingsModal', () => {
  it('returns null when isOpen is false', () => {
    const { container } = render(<SettingsModal isOpen={false} onClose={() => {}} />, { wrapper: Wrapper });
    expect(container).toBeEmptyDOMElement();
  });

  it('renders modal with tabs when isOpen is true', () => {
    render(<SettingsModal isOpen={true} onClose={() => {}} initialTab="notifications" />, { wrapper: Wrapper });
    expect(screen.getByText('settings.settings')).toBeInTheDocument();
    expect(screen.getByTestId('notifications-panel')).toBeInTheDocument();
  });
});
