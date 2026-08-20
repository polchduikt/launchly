import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ConditionNodeEditor } from '../ConditionNodeEditor';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../../../../../../i18n/config', () => ({
  t: (k: string, fb?: any) => (typeof fb === 'string' ? fb : k),
  useTranslation: () => ({ t: (k: string, fb?: any) => (typeof fb === 'string' ? fb : k) }),
}));

vi.mock('../../../../../../../store/useBotStore', () => ({
  useBotStore: (selector: any) => selector ? selector({ activeBotId: 1 }) : ({ activeBotId: 1 }),
}));

vi.mock('../../../../../../../hooks/broadcast/useBroadcastQueries', () => ({
  useTagsQuery: () => ({ data: [] }),
}));

vi.mock('../../../../../../../api/bot', () => ({
  getCustomFieldsApi: vi.fn(() => Promise.resolve({ fields: [] })),
  saveCustomFieldsApi: vi.fn(() => Promise.resolve()),
}));

const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={qc}>{children}</QueryClientProvider>
);

describe('ConditionNodeEditor', () => {
  it('renders ConditionNodeEditor with branches', () => {
    render(
      <ConditionNodeEditor
        data={{ branches: [] }}
        handleChange={vi.fn()}
      />,
      { wrapper: Wrapper }
    );

    expect(screen.getByText('editor.condition.if_not')).toBeInTheDocument();
  });
});
