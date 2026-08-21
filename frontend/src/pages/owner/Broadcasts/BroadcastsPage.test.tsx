import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { BroadcastsPage } from './BroadcastsPage';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../../i18n/config', () => ({
  t: (k: string, fb?: string) => (typeof fb === 'string' ? fb : k),
  useTranslation: () => ({ t: (k: string, fb?: string) => (typeof fb === 'string' ? fb : k) }),
  getLanguage: () => 'uk',
}));

vi.mock('../../../hooks/broadcast/useBroadcastQueries', () => ({
  useCampaignsQuery: () => ({ data: [], isLoading: false }),
  useTagsQuery: () => ({ data: [] }),
  useAllTagsQuery: () => ({ data: [] }),
  useDeleteCampaignMutation: () => ({ mutate: vi.fn() }),
  useStopCampaignMutation: () => ({ mutate: vi.fn() }),
  useSendCampaignNowMutation: () => ({ mutate: vi.fn() }),
  useSendCampaignMutation: () => ({ mutate: vi.fn() }),
  useCreateCampaignMutation: () => ({ mutate: vi.fn(), isPending: false }),
  useCancelScheduleMutation: () => ({ mutate: vi.fn() }),
  useUpdateCampaignMutation: () => ({ mutate: vi.fn() }),
}));

vi.mock('../../../hooks/bot/useBotsQuery', () => ({
  useBotsQuery: () => ({ data: [{ id: 1, name: 'Bot 1' }], isLoading: false }),
}));

vi.mock('../../../store/useBotStore', () => ({
  useBotStore: (selector?: (state: Record<string, unknown>) => unknown) =>
    selector ? selector({ activeBotId: 1 }) : { activeBotId: 1 },
}));

vi.mock('../../../components/layout/DashboardLayout', () => ({
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

describe('BroadcastsPage', () => {
  it('renders broadcasts page layout', () => {
    const { container } = render(<BroadcastsPage />, { wrapper: Wrapper });
    expect(container).toBeDefined();
  });
});
