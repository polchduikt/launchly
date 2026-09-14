import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryNodeEditor } from './QueryNodeEditor';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../../../../../i18n/config', () => ({
  t: (k: string, fb?: string) => (typeof fb === 'string' ? fb : k),
  useTranslation: () => ({ t: (k: string, fb?: string) => (typeof fb === 'string' ? fb : k) }),
}));

vi.mock('../../../../../../store/useBotStore', () => ({
  useBotStore: (selector?: (state: Record<string, unknown>) => unknown) =>
    selector ? selector({ activeBotId: 1 }) : { activeBotId: 1 },
}));

vi.mock('../../../../../../hooks/broadcast/useBroadcastQueries', () => ({
  useTagsQuery: () => ({ data: [] }),
}));

vi.mock('../../../../../../hooks/bot/useCustomFieldsQuery', () => ({
  useCustomFieldsQuery: () => ({ data: { fields: [] } }),
  useSaveCustomFieldsMutation: () => ({ mutate: vi.fn() }),
}));

import { ReactFlowProvider } from '@xyflow/react';

const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <ReactFlowProvider>
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  </ReactFlowProvider>
);

describe('QueryNodeEditor', () => {
  it('renders sort order, prefix, and filter controls', () => {
    const handleChange = vi.fn();
    render(
      <QueryNodeEditor
        data={{
          outputPrefix: 'found_user',
          sortOrder: 'RANDOM',
          excludeSelf: true,
          excludeInteractions: ['like', 'dislike'],
          filters: [
            { field: 'gender', operator: 'equals', value: 'female' }
          ]
        }}
        handleChange={handleChange}
      />,
      { wrapper: Wrapper }
    );

    expect(screen.getByText('Випадковий')).toBeInTheDocument();
    expect(screen.getByText('Найновіші')).toBeInTheDocument();
    expect(screen.getByText('gender')).toBeInTheDocument();
    expect(screen.getByDisplayValue('female')).toBeInTheDocument();
  });

  it('allows adding and removing filters', () => {
    const handleChange = vi.fn();
    render(
      <QueryNodeEditor
        data={{
          filters: []
        }}
        handleChange={handleChange}
      />,
      { wrapper: Wrapper }
    );

    const addBtn = screen.getByText(/Додати|add/i);
    fireEvent.click(addBtn);

    expect(handleChange).toHaveBeenCalledWith('filters', [
      { field: '', operator: 'equals', value: '' }
    ]);
  });
});
