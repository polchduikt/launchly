import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import AiPage from './AiPage';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../../i18n/config', () => ({
  t: (k: string, fb?: string) => (typeof fb === 'string' ? fb : k),
  useTranslation: () => ({ t: (k: string, fb?: string) => (typeof fb === 'string' ? fb : k) }),
  getLanguage: () => 'uk',
}));

vi.mock('../../../hooks/ai/useAiQueries', () => ({
  useAiSessionsQuery: () => ({
    data: [{ id: 1, title: 'Test Session', createdAt: '2026-09-01T00:00:00', updatedAt: '2026-09-01T00:00:00' }],
    isLoading: false,
  }),
  useAiSessionDetailsQuery: () => ({
    data: { id: 1, title: 'Test Session', createdAt: '2026-09-01T00:00:00', updatedAt: '2026-09-01T00:00:00', messages: [] },
    isLoading: false,
  }),
  useCreateAiSessionMutation: () => ({
    mutateAsync: vi.fn().mockResolvedValue({ id: 2, title: 'New chat' }),
    isPending: false,
  }),
  useDeleteAiSessionMutation: () => ({
    mutateAsync: vi.fn().mockResolvedValue(undefined),
    isPending: false,
  }),
  useAiChatMutation: () => ({
    mutateAsync: vi.fn().mockResolvedValue({ reply: 'AI response' }),
    isPending: false,
  }),
  useAiUsageQuery: () => ({
    data: { tokensUsed: 10, tokenLimit: 100, remainingPercentage: 90 },
    isLoading: false,
    refetch: vi.fn(),
  }),
}));

vi.mock('../../../store/useAiStore', () => ({
  useAiStore: () => ({
    setActiveTab: vi.fn(),
    setOnGenerate: vi.fn(),
    setIsOpen: vi.fn(),
  }),
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

describe('AiPage', () => {
  it('renders Launchly AI chat interface', () => {
    render(<AiPage />, { wrapper: Wrapper });

    expect(screen.getByTestId('dashboard-layout')).toBeInTheDocument();
    expect(screen.getAllByText('LAUNCHLY AI').length).toBeGreaterThanOrEqual(1);
  });
});
