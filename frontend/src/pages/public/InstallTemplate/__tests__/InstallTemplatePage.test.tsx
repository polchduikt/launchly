import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { InstallTemplatePage } from '../InstallTemplatePage';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../../../i18n/config', () => ({
  t: (k: string, fb?: any) => (typeof fb === 'string' ? fb : k),
  useTranslation: () => ({ t: (k: string, fb?: any) => (typeof fb === 'string' ? fb : k) }),
  getLanguage: () => 'uk',
}));

vi.mock('../../../../api/templateApi', () => ({
  getTemplateByShareCodeApi: vi.fn(() =>
    Promise.resolve({
      id: 1,
      name: 'E-commerce Bot',
      description: 'Online store template',
      shareCode: 'TEST123',
    })
  ),
  installTemplateApi: vi.fn(() => Promise.resolve({})),
}));

vi.mock('../../../../hooks/bot/useBotsQuery', () => ({
  useBotsQuery: () => ({ data: [{ id: 1, name: 'My Bot' }], isLoading: false }),
}));

vi.mock('../../../../store/useAuthStore', () => ({
  useAuthStore: (selector: any) =>
    selector ? selector({ accessToken: 'token' }) : { accessToken: 'token' },
}));

vi.mock('../../../../store/useBotStore', () => ({
  useBotStore: (selector: any) =>
    selector ? selector({ activeBotId: 1 }) : { activeBotId: 1 },
}));

const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });

describe('InstallTemplatePage', () => {
  it('renders install template page with template details', async () => {
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={['/templates/install/TEST123']}>
          <Routes>
            <Route path="/templates/install/:shareCode" element={<InstallTemplatePage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(await screen.findByText('E-commerce Bot')).toBeInTheDocument();
  });
});
