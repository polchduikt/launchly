import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import CheckoutSuccessPage from '../CheckoutSuccessPage';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../../../i18n/config', () => ({
  t: (k: string, fb?: any) => (typeof fb === 'string' ? fb : k),
  useTranslation: () => ({ t: (k: string, fb?: any) => (typeof fb === 'string' ? fb : k) }),
  getLanguage: () => 'uk',
}));

vi.mock('../../../../hooks/bot/useBillingQueries', () => ({
  useConfirmSessionMutation: () => ({ mutate: vi.fn(), isPending: false }),
}));

const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={qc}>
    <MemoryRouter initialEntries={['/checkout/success?session_id=cs_test_123']}>
      {children}
    </MemoryRouter>
  </QueryClientProvider>
);

describe('CheckoutSuccessPage', () => {
  it('renders checkout success confirmation and transaction id', () => {
    render(<CheckoutSuccessPage />, { wrapper: Wrapper });

    expect(screen.getByText('cs_test_123')).toBeInTheDocument();
  });
});
