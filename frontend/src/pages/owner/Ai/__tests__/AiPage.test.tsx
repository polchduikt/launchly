import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import AiPage from '../AiPage';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../../../i18n/config', () => ({
  t: (k: string, fb?: string) => (typeof fb === 'string' ? fb : k),
  useTranslation: () => ({ t: (k: string, fb?: string) => (typeof fb === 'string' ? fb : k) }),
  getLanguage: () => 'uk',
}));

vi.mock('../../../../hooks/ai/useAiAssistant', () => ({
  useAiAssistant: () => ({
    inputValue: '',
    setInputValue: vi.fn(),
    isUsageLoading: false,
    usage: { used: 10, limit: 100 },
    isLimitReached: false,
    chatMutation: { isPending: false },
    messagesEndRef: { current: null },
    refetchUsage: vi.fn(),
    handleSend: vi.fn(),
    handleKeyDown: vi.fn(),
    handleQuickQuestion: vi.fn(),
  }),
}));

vi.mock('../../../../store/useAiStore', () => ({
  useAiStore: () => ({
    messages: [],
    clearMessages: vi.fn(),
    setActiveTab: vi.fn(),
    setOnGenerate: vi.fn(),
    setIsOpen: vi.fn(),
  }),
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

describe('AiPage', () => {
  it('renders Launchly AI chat interface', () => {
    render(<AiPage />, { wrapper: Wrapper });

    expect(screen.getByTestId('dashboard-layout')).toBeInTheDocument();
    expect(screen.getByText('Launchly AI')).toBeInTheDocument();
  });
});
