import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { InteractionNodeEditor } from './InteractionNodeEditor';
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

describe('InteractionNodeEditor', () => {
  it('renders interaction action options and handles', () => {
    const handleChange = vi.fn();
    render(
      <InteractionNodeEditor
        data={{
          interactionType: 'like',
          checkMutual: true,
        }}
        handleChange={handleChange}
      />,
      { wrapper: Wrapper }
    );

    expect(screen.getByText('Лайк')).toBeInTheDocument();
    expect(screen.getByText('Пропустити')).toBeInTheDocument();
    expect(screen.getByText('В обране')).toBeInTheDocument();
    expect(screen.getByText('Переглянуто')).toBeInTheDocument();
  });

  it('allows changing interaction type', () => {
    const handleChange = vi.fn();
    render(
      <InteractionNodeEditor
        data={{
          targetUserId: '{found_user.telegram_id}',
          interactionType: 'like',
          checkMutual: true,
        }}
        handleChange={handleChange}
      />,
      { wrapper: Wrapper }
    );

    const dislikeBtn = screen.getByText('Пропустити');
    fireEvent.click(dislikeBtn);

    expect(handleChange).toHaveBeenCalledWith('interactionType', 'dislike');
  });
});
