import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useChatLocalStorage } from './useChatLocalStorage';
import type { ConversationResponse } from '../../types/crm';

const mockGetLabels = vi.fn().mockResolvedValue(['Lead', 'Customer']);
const mockAddLabel = vi.fn().mockResolvedValue(['Lead', 'Customer', 'VIP']);
const mockDeleteLabel = vi.fn().mockResolvedValue(['Customer']);
const mockUpdateConv = vi.fn().mockResolvedValue({});

vi.mock('../../api/crm', () => ({
  getLabelsApi: () => mockGetLabels(),
  addLabelApi: (name: string) => mockAddLabel(name),
  deleteLabelApi: (name: string) => mockDeleteLabel(name),
  updateConversationApi: (id: number, data: unknown) => mockUpdateConv(id, data),
}));

const mockConversations: ConversationResponse[] = [
  {
    id: 1,
    botId: 1,
    botName: 'Bot 1',
    botUserName: 'Alice',
    botUserUsername: 'alice',
    botUserTelegramId: 101,
    botUserPhotoUrl: null,
    status: 'OPEN',
    unread: true,
    favorite: false,
    lastMessage: 'Hi',
    lastMessageAt: '2026-08-20T10:00:00Z',
    updatedAt: '2026-08-20T10:00:00Z',
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
      expect(result.current.labels).toEqual(['Lead', 'Customer']);
    });
    expect(result.current.unreadConvIds).toContain(1);
    expect(result.current.contactNotes[1]).toBe('Important client');
  });

  it('toggles favorites correctly', async () => {
    const { result } = renderHook(() =>
      useChatLocalStorage({ conversations: mockConversations, selectedConvId: 1 })
    );

    await waitFor(() => {
      expect(result.current.labels).toEqual(['Lead', 'Customer']);
    });

    act(() => {
      result.current.toggleFavorite(1);
    });

    expect(result.current.favorites).toContain(1);

    act(() => {
      result.current.toggleFavorite(1);
    });

    expect(result.current.favorites).not.toContain(1);
  });

  it('adds and removes labels', async () => {
    const { result } = renderHook(() =>
      useChatLocalStorage({ conversations: mockConversations, selectedConvId: 1 })
    );

    await act(async () => {
      await result.current.addLabelByName('VIP');
    });

    expect(mockAddLabel).toHaveBeenCalledWith('VIP');

    await act(async () => {
      await result.current.deleteLabelByName('Lead');
    });

    expect(mockDeleteLabel).toHaveBeenCalledWith('Lead');
  });
});
