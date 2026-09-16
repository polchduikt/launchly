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
  useUpdateTagMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
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

  it('opens folder menu when more button is clicked', async () => {
    localStorage.setItem('launchly_tag_folders_1', JSON.stringify([{ id: 'f1', name: 'Folder 123' }]));
    const { fireEvent } = await import('@testing-library/react');
    render(
      <QueryClientProvider client={qc}>
        <TagsSettingsPanel />
      </QueryClientProvider>
    );
    expect(screen.getByText('Folder 123')).toBeInTheDocument();

    const folderContainer = screen.getByText('Folder 123').closest('div');
    const moreBtn = folderContainer?.querySelector('button:last-child');
    expect(moreBtn).toBeTruthy();

    fireEvent.click(moreBtn!);
    expect(screen.getByText('Перейменувати')).toBeInTheDocument();
    expect(screen.getByText('Видалити')).toBeInTheDocument();
  });
});
