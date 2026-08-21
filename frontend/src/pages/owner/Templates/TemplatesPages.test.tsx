import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MyTemplatesPage } from './MyTemplatesPage';
import { TemplateDetailPage } from './TemplateDetailPage';
import { CreateTemplateWizardPage } from './CreateTemplateWizardPage';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../../i18n/config', () => ({
  t: (k: string, fb?: string) => (typeof fb === 'string' ? fb : k),
  useTranslation: () => ({ t: (k: string, fb?: string) => (typeof fb === 'string' ? fb : k) }),
  getLanguage: () => 'uk',
}));

vi.mock('../../../api/templateApi', () => ({
  getMyTemplatesApi: vi.fn(() => Promise.resolve([])),
  getInstalledTemplatesApi: vi.fn(() => Promise.resolve([])),
  getTemplateDetailApi: vi.fn(() =>
    Promise.resolve({
      id: 1,
      name: 'Template 1',
      description: 'Desc',
      shareCode: 'ABC',
      price: 0,
      currency: 'USD',
    })
  ),
  createTemplateApi: vi.fn(() => Promise.resolve({})),
}));

vi.mock('../../../hooks/bot/useBotsQuery', () => ({
  useBotsQuery: () => ({ data: [{ id: 1, name: 'Bot 1' }], isLoading: false }),
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

describe('Templates Pages', () => {
  it('renders MyTemplatesPage', () => {
    const { container } = render(<MyTemplatesPage />, { wrapper: Wrapper });
    expect(container).toBeDefined();
  });

  it('renders TemplateDetailPage', () => {
    const { container } = render(
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={['/templates/1']}>
          <Routes>
            <Route path="/templates/:id" element={<TemplateDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );
    expect(container).toBeDefined();
  });

  it('renders CreateTemplateWizardPage', () => {
    const { container } = render(<CreateTemplateWizardPage />, { wrapper: Wrapper });
    expect(container).toBeDefined();
  });
});
