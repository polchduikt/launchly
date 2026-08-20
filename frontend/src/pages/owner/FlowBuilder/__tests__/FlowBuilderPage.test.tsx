import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { FlowBuilderPage } from '../FlowBuilderPage';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../../../i18n/config', () => ({
  t: (k: string, fb?: any) => (typeof fb === 'string' ? fb : k),
  useTranslation: () => ({ t: (k: string, fb?: any) => (typeof fb === 'string' ? fb : k) }),
  getLanguage: () => 'uk',
}));

vi.mock('../../../../hooks/bot/useFlowBuilder', () => ({
  useFlowBuilder: () => ({
    nodes: [],
    edges: [],
    displayNodes: [],
    collaborators: [],
    onNodesChange: vi.fn(),
    onEdgesChange: vi.fn(),
    onConnect: vi.fn(),
    activeBotId: 1,
    isLoadingSchema: false,
    saveMutation: { mutate: vi.fn(), isPending: false },
    activeSidebarTab: null,
    setActiveSidebarTab: vi.fn(),
    selectedNodeId: null,
    selectedNode: null,
    handleUpdateNodeData: vi.fn(),
    handleCloseEditor: vi.fn(),
    takeSnapshot: vi.fn(),
    undo: vi.fn(),
    redo: vi.fn(),
  }),
}));

vi.mock('../../../../hooks/bot/useFlowCollaboration', () => ({
  useFlowCollaboration: () => ({
    collaborators: [],
    updateLocalAction: vi.fn(),
  }),
}));

const mockSetOnGenerate = vi.fn();
vi.mock('../../../../store/useAiStore', () => ({
  useAiStore: (selector: any) =>
    selector
      ? selector({
          setOnGenerate: mockSetOnGenerate,
          setHasExistingNodes: vi.fn(),
          setIsOpen: vi.fn(),
          setActiveTab: vi.fn(),
        })
      : {
          setOnGenerate: mockSetOnGenerate,
          setHasExistingNodes: vi.fn(),
          setIsOpen: vi.fn(),
          setActiveTab: vi.fn(),
        },
}));

vi.mock('../../../../hooks/bot/useBotsQuery', () => ({
  useBotsQuery: () => ({ data: [{ id: 1, name: 'Bot 1' }], isLoading: false }),
}));

vi.mock('../../../../hooks/broadcast/useBroadcastQueries', () => ({
  useTagsQuery: () => ({ data: [] }),
}));

vi.mock('../../../../store/useBotStore', () => ({
  useBotStore: (selector: any) =>
    selector ? selector({ activeBotId: 1, setActiveBotId: vi.fn() }) : { activeBotId: 1, setActiveBotId: vi.fn() },
}));

const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });

describe('FlowBuilderPage', () => {
  it('renders flow builder canvas page', () => {
    const { container } = render(
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={['/flow-builder/1']}>
          <Routes>
            <Route path="/flow-builder/:botId" element={<FlowBuilderPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );
    expect(container).toBeDefined();
  });
});
