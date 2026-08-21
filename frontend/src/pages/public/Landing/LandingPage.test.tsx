import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { LandingPage } from './LandingPage';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../i18n/config', () => ({
  t: (k: string, fb?: string) => (typeof fb === 'string' ? fb : k),
  useTranslation: () => ({ t: (k: string, fb?: string) => (typeof fb === 'string' ? fb : k) }),
  getLanguage: () => 'uk',
}));

vi.mock('../../hooks/useSEO', () => ({
  useSEO: vi.fn(),
}));

const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });

describe('LandingPage', () => {
  it('renders landing page container and header', () => {
    const { container } = render(
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <LandingPage />
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(container.querySelector('header')).toBeInTheDocument();
    expect(container.querySelector('footer')).toBeInTheDocument();
  });
});
