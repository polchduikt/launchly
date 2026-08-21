import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import RegisterPage from './RegisterPage';
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
vi.mock('../../../hooks/auth/useRegisterForm', () => ({
  useRegisterForm: () => ({
    form: {
      register: vi.fn(() => ({})),
      formState: { errors: {} },
    },
    onSubmit: mockSubmit,
    isPending: false,
    apiError: null,
  }),
}));

const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={qc}>
    <MemoryRouter>{children}</MemoryRouter>
  </QueryClientProvider>
);

describe('RegisterPage', () => {
  it('renders register form and headings', () => {
    const { container } = render(<RegisterPage />, { wrapper: Wrapper });

    expect(container.querySelector('form')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create Account|Створити акаунт/i })).toBeInTheDocument();
  });

  it('triggers submit on form submit', () => {
    const { container } = render(<RegisterPage />, { wrapper: Wrapper });

    const form = container.querySelector('form')!;
    fireEvent.submit(form);

    expect(mockSubmit).toHaveBeenCalled();
  });
});
