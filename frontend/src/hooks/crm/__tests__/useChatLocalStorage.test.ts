import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useChatLocalStorage } from '../useChatLocalStorage';
import type { ConversationResponse } from '../../../types/crm';

const mockGetLabels = vi.fn().mockResolvedValue(['Lead', 'Customer']);
const mockAddLabel = vi.fn().mockResolvedValue(['Lead', 'Customer', 'VIP']);
const mockDeleteLabel = vi.fn().mockResolvedValue(['Customer']);
const mockUpdateConv = vi.fn().mockResolvedValue({});

vi.mock('../../../api/crm', () => ({
  getLabelsApi: () => mockGetLabels(),
  addLabelApi: (name: string) => mockAddLabel(name),
  deleteLabelApi: (name: string) => mockDeleteLabel(name),
  updateConversationApi: (id: number, data: any) => mockUpdateConv(id, data),
}));

const mockConversations: ConversationResponse[] = [
  {
    id: 1,
    botId: 1,
    botUserName: 'Alice',
    status: 'OPEN',
    unread: true,
    favorite: false,
    tags: ['VIP'],
    notes: 'Important client',
  },
];

describe('useChatLocalStorage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('populates initial state from conversations and API', async () => {
    const { result } = renderHook(() =>
      useChatLocalStorage({ conversations: mockConversations, selectedConvId: 1 })
    );

    await waitFor(() => {
      expect(result.current.unreadConvIds).toContain(1);
    });
    expect(result.current.contactTags[1]).toEqual(['VIP']);
    expect(result.current.contactNotes[1]).toBe('Important client');
  });

  it('marks conversation as read', async () => {
    const { result } = renderHook(() =>
      useChatLocalStorage({ conversations: mockConversations, selectedConvId: 1 })
    );

    act(() => {
      result.current.markAsRead(1);
    });

    await waitFor(() => {
      expect(result.current.unreadConvIds).not.toContain(1);
    });
    expect(mockUpdateConv).toHaveBeenCalledWith(1, { unread: false });
  });

  it('toggles favorite status', async () => {
    const { result } = renderHook(() =>
      useChatLocalStorage({ conversations: mockConversations, selectedConvId: 1 })
    );

    act(() => {
      result.current.toggleFavorite(1);
    });

    await waitFor(() => {
      expect(result.current.favorites).toContain(1);
    });
    expect(mockUpdateConv).toHaveBeenCalledWith(1, { favorite: true });
  });
});
