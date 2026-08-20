import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { BroadcastBuilderPage } from '../BroadcastBuilderPage';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../../../i18n/config', () => ({
  t: (k: string, fb?: string) => (typeof fb === 'string' ? fb : k),
  useTranslation: () => ({ t: (k: string, fb?: string) => (typeof fb === 'string' ? fb : k) }),
  getLanguage: () => 'uk',
}));

vi.mock('../../../../hooks/broadcast/useBroadcastBuilder', () => ({
  useBroadcastBuilder: () => ({
    campaign: { id: 1, name: 'Campaign 1', message: 'Hello', status: 'DRAFT' },
    isLoading: false,
    updateCampaignMut: { mutate: vi.fn() },
    sendCampaignNowMut: { mutate: vi.fn() },
    messageText: '',
    setMessageText: vi.fn(),
    buttons: [],
    setButtons: vi.fn(),
    nodes: [],
    edges: [],
    displayNodes: [],
    collaborators: [],
    selectedNodeId: null,
    updateLocalAction: vi.fn(),
  }),
}));

vi.mock('../../../../hooks/bot/useBotsQuery', () => ({
  useBotsQuery: () => ({ data: [{ id: 1, name: 'Bot 1' }], isLoading: false }),
}));

vi.mock('../../../../store/useBotStore', () => ({
  useBotStore: (selector?: (state: Record<string, unknown>) => unknown) =>
    selector ? selector({ activeBotId: 1 }) : { activeBotId: 1 },
}));

const mockSetHasExistingNodes = vi.fn();
vi.mock('../../../../store/useAiStore', () => ({
  useAiStore: (selector?: (state: Record<string, unknown>) => unknown) =>
    selector
      ? selector({
          setHasExistingNodes: mockSetHasExistingNodes,
          setIsOpen: vi.fn(),
          setActiveTab: vi.fn(),
          setOnGenerate: vi.fn(),
        })
      : {
          setHasExistingNodes: mockSetHasExistingNodes,
          setIsOpen: vi.fn(),
          setActiveTab: vi.fn(),
          setOnGenerate: vi.fn(),
        },
}));

const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });

describe('BroadcastBuilderPage', () => {
  it('renders broadcast builder page', () => {
    const { container } = render(
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={['/broadcasts/1']}>
          <Routes>
            <Route path="/broadcasts/:id" element={<BroadcastBuilderPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );
    expect(container).toBeDefined();
  });
});
