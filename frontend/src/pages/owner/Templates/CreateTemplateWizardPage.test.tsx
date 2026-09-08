import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CreateTemplateWizardPage } from './CreateTemplateWizardPage';

vi.mock('../../../store/useBotStore', () => ({
  useBotStore: (selector?: (state: Record<string, unknown>) => unknown) =>
    selector ? selector({ activeBotId: 1 }) : { activeBotId: 1 },
}));

vi.mock('../../../store/useAuthStore', () => ({
  useAuthStore: (selector?: (state: Record<string, unknown>) => unknown) =>
    selector ? selector({ user: { id: 1, email: 'test@example.com' } }) : { user: { id: 1 } },
}));

vi.mock('../../../hooks/bot/useBotsQuery', () => ({
  useBotsQuery: () => ({ data: [{ id: 1, name: 'Bot 1' }], isLoading: false }),
}));

vi.mock('../../../api/broadcast', () => ({
  getCampaignsApi: vi.fn().mockResolvedValue([]),
  getTagsApi: vi.fn().mockResolvedValue([]),
}));

vi.mock('../../../api/bot', () => ({
  getCustomFieldsApi: vi.fn().mockResolvedValue([]),
}));

vi.mock('../../../i18n/config', () => ({
  t: (k: string, fb?: unknown) => (typeof fb === 'string' ? fb : k),
  useTranslation: () => ({
    t: (k: string, fb?: unknown) => (typeof fb === 'string' ? fb : k),
  }),
}));

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <MemoryRouter initialEntries={['/templates/create']}>{children}</MemoryRouter>
  </QueryClientProvider>
);

describe('CreateTemplateWizardPage', () => {
  it('renders step 1 with selection categories', async () => {
    render(<CreateTemplateWizardPage />, { wrapper: Wrapper });
    expect(screen.getByText('Створення нового шаблону')).toBeInTheDocument();
    expect(screen.getByText('Виберіть елементи шаблону')).toBeInTheDocument();
  });

  it('navigates to step 2 after selection and renders form inputs', async () => {
    render(<CreateTemplateWizardPage />, { wrapper: Wrapper });

    const selectAllBtn = screen.getByText('Вибрати все');
    fireEvent.click(selectAllBtn);

    const nextBtn = screen.getByRole('button', { name: /далі/i });
    expect(nextBtn).not.toBeDisabled();
    fireEvent.click(nextBtn);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Введіть назву шаблону...')).toBeInTheDocument();
    });

    const nameInput = screen.getByPlaceholderText('Введіть назву шаблону...');
    fireEvent.change(nameInput, { target: { value: 'My Awesome Bot Template' } });

    expect((nameInput as HTMLInputElement).value).toBe('My Awesome Bot Template');
  });
});
