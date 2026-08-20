import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AutomationsPage } from '../AutomationsPage';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../../../i18n/config', () => ({
  t: (k: string, fb?: any) => (typeof fb === 'string' ? fb : k),
  useTranslation: () => ({ t: (k: string, fb?: any) => (typeof fb === 'string' ? fb : k) }),
  getLanguage: () => 'uk',
}));

vi.mock('../../../../api/bot', () => ({
  getAutomationFoldersApi: vi.fn(() => Promise.resolve([])),
  saveAutomationFoldersApi: vi.fn(() => Promise.resolve()),
}));

vi.mock('../../../../hooks/bot/useBotsQuery', () => ({
  useBotsQuery: () => ({
    data: [
      { id: 1, name: 'Lead Bot', active: true, hasTelegramToken: true, folderId: null },
    ],
    isLoading: false,
  }),
}));

vi.mock('../../../../store/useBotStore', () => ({
  useBotStore: (selector: any) =>
    selector ? selector({ activeBotId: 1, setActiveBotId: vi.fn() }) : { activeBotId: 1, setActiveBotId: vi.fn() },
}));

vi.mock('../../../../components/layout/DashboardLayout', () => ({
  DashboardLayout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dashboard-layout">{children}</div>
  ),
}));

const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={qc}>
    <MemoryRouter>{children}</MemoryRouter>
  </QueryClientProvider>
);

describe('AutomationsPage', () => {
  it('renders automations list and controls', () => {
    render(<AutomationsPage />, { wrapper: Wrapper });

    expect(screen.getByTestId('dashboard-layout')).toBeInTheDocument();
    expect(screen.getByText('Lead Bot')).toBeInTheDocument();
  });
});
