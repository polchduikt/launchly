import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TagsSettingsPanel } from './TagsSettingsPanel';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../../../store/useBotStore', () => ({
  useBotStore: () => 1,
}));

vi.mock('../../../../hooks/bot/useBotsQuery', () => ({
  useBotsQuery: () => ({ data: [{ id: 1 }] }),
}));

vi.mock('../../../../hooks/broadcast/useBroadcastQueries', () => ({
  useAllTagsQuery: () => ({ data: [], refetch: vi.fn() }),
  useCreateTagMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock('../../../../api/broadcast', () => ({
  deleteTagApi: vi.fn(),
}));

vi.mock('../../../../i18n/config', () => ({
  t: (k: string, fb?: string) => (typeof fb === 'string' ? fb : k),
  useTranslation: () => ({ t: (k: string, fb?: string) => (typeof fb === 'string' ? fb : k) }),
}));

const qc = new QueryClient();

describe('TagsSettingsPanel', () => {
  it('renders tags settings panel', () => {
    render(
      <QueryClientProvider client={qc}>
        <TagsSettingsPanel />
      </QueryClientProvider>
    );
    expect(screen.getByText('settings.tags.title')).toBeInTheDocument();
  });
});
