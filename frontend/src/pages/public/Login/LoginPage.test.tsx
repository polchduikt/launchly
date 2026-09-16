import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import LoginPage from './LoginPage';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../../i18n/config', () => ({
  t: (k: string, fb?: string) => (typeof fb === 'string' ? fb : k),
  useTranslation: () => ({ t: (k: string, fb?: string) => (typeof fb === 'string' ? fb : k) }),
  getLanguage: () => 'uk',
}));

vi.mock('../../../hooks/useSEO', () => ({
  useSEO: vi.fn(),
}));

const mockSubmit = vi.fn((e) => e?.preventDefault?.());
vi.mock('../../../hooks/auth/useLoginForm', () => ({
  useLoginForm: () => ({
    form: {
      register: vi.fn(() => ({})),
      formState: { errors: {} },
    },
    onSubmit: mockSubmit,
    isPending: false,
    apiError: null,
    turnstileToken: 'mock-token',
    setTurnstileToken: vi.fn(),
    isTurnstileReady: true,
  }),
}));

const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={qc}>
    <MemoryRouter>{children}</MemoryRouter>
  </QueryClientProvider>
);

describe('LoginPage', () => {
  it('renders login form and title', () => {
    const { container } = render(<LoginPage />, { wrapper: Wrapper });

    expect(container.querySelector('form')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign In|Увійти/i })).toBeInTheDocument();
  });

  it('submits form on submit', () => {
    const { container } = render(<LoginPage />, { wrapper: Wrapper });

    const form = container.querySelector('form')!;
    fireEvent.submit(form);

    expect(mockSubmit).toHaveBeenCalled();
  });
});
