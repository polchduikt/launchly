import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { ChatPage } from './ChatPage';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../../i18n/config', () => ({
  t: (k: string, fb?: string) => (typeof fb === 'string' ? fb : k),
  useTranslation: () => ({ t: (k: string, fb?: string) => (typeof fb === 'string' ? fb : k) }),
  getLanguage: () => 'uk',
}));

vi.mock('@emoji-mart/react', () => ({
  default: () => <div data-testid="emoji-picker">Picker</div>,
}));

vi.mock('@emoji-mart/data', () => ({
  default: {},
}));

vi.mock('../../../api/crm', () => ({
  getLabelsApi: vi.fn().mockResolvedValue([]),
  addLabelApi: vi.fn().mockResolvedValue([]),
  deleteLabelApi: vi.fn().mockResolvedValue([]),
  updateConversationApi: vi.fn().mockResolvedValue({}),
  getConversationsApi: vi.fn().mockResolvedValue([]),
  getAllConversationsApi: vi.fn().mockResolvedValue([]),
}));

vi.mock('../../../hooks/crm/useCrmQueries', () => ({
  useConversationQuery: () => ({ data: null, isLoading: false }),
  useConversationsQuery: () => ({ data: [], isLoading: false }),
  useAllConversationsQuery: () => ({ data: [], isLoading: false }),
  useMessagesQuery: () => ({ data: [], isLoading: false }),
  useSendMessageMutation: () => ({ mutate: vi.fn() }),
  useCloseConversationMutation: () => ({ mutate: vi.fn() }),
  useReopenConversationMutation: () => ({ mutate: vi.fn() }),
  useAllBotUsersQuery: () => ({ data: [] }),
  useBotUsersQuery: () => ({ data: [] }),
  useUpdateContactMetadataMutation: () => ({ mutate: vi.fn() }),
  useUpdateConversationMutation: () => ({ mutate: vi.fn() }),
  useSendNoteMutation: () => ({ mutate: vi.fn() }),
}));

vi.mock('../../../hooks/crm/useCrmWebSocket', () => ({
  useCrmWebSocket: vi.fn(),
}));

vi.mock('../../../hooks/crm/useChatLocalStorage', () => ({
  useChatLocalStorage: () => ({
    labels: [],
    showAddLabel: false,
    setShowAddLabel: vi.fn(),
    newLabelName: '',
    setNewLabelName: vi.fn(),
    favorites: [],
    contactTags: {},
    showAddTag: false,
    setShowAddTag: vi.fn(),
    newTagName: '',
    setNewTagName: vi.fn(),
    contactNotes: {},
    unreadConvIds: [],
    markAsRead: vi.fn(),
    toggleFavorite: vi.fn(),
    addLabel: vi.fn(),
    addLabelByName: vi.fn(),
    deleteLabelByName: vi.fn(),
    addTag: vi.fn(),
    removeTag: vi.fn(),
    saveNote: vi.fn(),
  }),
}));

vi.mock('../../../hooks/bot/useBotsQuery', () => ({
  useBotsQuery: () => ({ data: [{ id: 1, name: 'Bot 1' }], isLoading: false }),
}));

vi.mock('../../../store/useBotStore', () => ({
  useBotStore: (selector?: (state: Record<string, unknown>) => unknown) =>
    selector ? selector({ activeBotId: 1 }) : { activeBotId: 1, setActiveBotId: vi.fn() },
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

describe('ChatPage', () => {
  it('renders chat CRM page layout', () => {
    const { container } = render(<ChatPage />, { wrapper: Wrapper });
    expect(container).toBeDefined();
  });
});
