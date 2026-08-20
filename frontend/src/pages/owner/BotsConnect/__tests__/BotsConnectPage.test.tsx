import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BotsConnectPage } from '../BotsConnectPage';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../../../i18n/config', () => ({
  t: (k: string, fb?: string) => (typeof fb === 'string' ? fb : k),
  useTranslation: () => ({ t: (k: string, fb?: string) => (typeof fb === 'string' ? fb : k) }),
  getLanguage: () => 'uk',
}));

vi.mock('../../../../hooks/bot/useBotsQuery', () => ({
  useBotsQuery: () => ({ data: [], isLoading: false }),
}));

vi.mock('../../../../hooks/bot/useBotMutations', () => ({
  useCreateBotMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={qc}>
    <MemoryRouter>{children}</MemoryRouter>
  </QueryClientProvider>
);

describe('BotsConnectPage', () => {
  it('renders bot connection wizard step 1', () => {
    render(<BotsConnectPage />, { wrapper: Wrapper });

    expect(screen.getByText('Where would you like to start?')).toBeInTheDocument();
  });
});
