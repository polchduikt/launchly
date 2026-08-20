import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ActionNodeEditor } from '../ActionNodeEditor';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../../../../../../i18n/config', () => ({
  t: (k: string, fb?: string) => (typeof fb === 'string' ? fb : k),
  useTranslation: () => ({ t: (k: string, fb?: string) => (typeof fb === 'string' ? fb : k) }),
}));

vi.mock('../../../../../../../store/useBotStore', () => ({
  useBotStore: (selector?: (state: Record<string, unknown>) => unknown) => selector ? selector({ activeBotId: 1 }) : ({ activeBotId: 1 }),
}));

vi.mock('../../../../../../../store/useAuthStore', () => ({
  useAuthStore: (selector?: (state: Record<string, unknown>) => unknown) => selector ? selector({ user: { id: 1 } }) : ({ user: { id: 1 } }),
}));

vi.mock('../../../../../../../hooks/broadcast/useBroadcastQueries', () => ({
  useTagsQuery: () => ({ data: [] }),
  useCreateTagMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock('../../../../../../../hooks/integration/useIntegrationQueries', () => ({
  useIntegrationsQuery: () => ({ data: [] }),
}));

vi.mock('../../../../../../../api/bot', () => ({
  getCustomFieldsApi: vi.fn(() => Promise.resolve({ fields: [] })),
  saveCustomFieldsApi: vi.fn(() => Promise.resolve()),
}));

const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={qc}>{children}</QueryClientProvider>
);

describe('ActionNodeEditor', () => {
  it('renders ActionNodeEditor with actions list and add action button', async () => {
    render(
      <ActionNodeEditor
        data={{ actions: [] }}
        handleChange={vi.fn()}
      />,
      { wrapper: Wrapper }
    );

    expect(await screen.findByText(/editor.action.add_action|editor.action.actions/i)).toBeInTheDocument();
  });
});
