import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useChatFilters } from '../useChatFilters';
import type { ConversationResponse } from '../../../types/crm';
import type { BotUserResponse } from '../../../types/bot';

const mockConversations: ConversationResponse[] = [
  {
    id: 1,
    botId: 1,
    botName: 'Bot 1',
    botUserName: 'Alice Smith',
    botUserUsername: 'alice',
    botUserTelegramId: 101,
    botUserPhotoUrl: null,
    status: 'OPEN',
    unread: true,
    lastMessage: 'Hi there',
    lastMessageAt: '2026-08-20T10:00:00Z',
    updatedAt: '2026-08-20T10:00:00Z',
    favorite: true,
  },
  {
    id: 2,
    botId: 1,
    botName: 'Bot 1',
    botUserName: 'Bob Johnson',
    botUserUsername: 'bob_j',
    botUserTelegramId: 102,
    botUserPhotoUrl: null,
    status: 'CLOSED',
    unread: false,
    lastMessage: 'Bye',
    lastMessageAt: '2026-08-19T10:00:00Z',
    updatedAt: '2026-08-19T10:00:00Z',
    favorite: false,
  },
];

const mockBotUsers: BotUserResponse[] = [
  {
    id: 1,
    telegramId: 101,
    firstName: 'Alice',
    lastName: 'Smith',
    username: 'alice',
    currentNodeId: null,
    photoUrl: null,
    tags: ['VIP'],
    createdAt: '2026-08-01',
    metadata: JSON.stringify({ labels: ['VIP'] }),
  },
];

describe('useChatFilters', () => {
  it('filters open conversations by default', () => {
    const { result } = renderHook(() =>
      useChatFilters({
        conversations: mockConversations,
        favorites: [1],
        unreadConvIds: [1],
        botUsers: mockBotUsers,
      })
    );

    expect(result.current.filteredConversations.length).toBe(1);
    expect(result.current.filteredConversations[0].id).toBe(1);
  });

  it('filters closed conversations when status changed to closed', () => {
    const { result } = renderHook(() =>
      useChatFilters({
        conversations: mockConversations,
        favorites: [1],
        unreadConvIds: [1],
        botUsers: mockBotUsers,
      })
    );

    act(() => {
      result.current.setChatFilter('closed');
    });

    expect(result.current.filteredConversations.length).toBe(1);
    expect(result.current.filteredConversations[0].id).toBe(2);
  });

  it('filters by search query matching username', () => {
    const { result } = renderHook(() =>
      useChatFilters({
        conversations: mockConversations,
        favorites: [1],
        unreadConvIds: [1],
        botUsers: mockBotUsers,
      })
    );

    act(() => {
      result.current.setSearchQuery('Alice');
    });

    expect(result.current.filteredConversations.length).toBe(1);
    expect(result.current.filteredConversations[0].botUserName).toBe('Alice Smith');
  });

  it('filters by unread status', () => {
    const { result } = renderHook(() =>
      useChatFilters({
        conversations: mockConversations,
        favorites: [1],
        unreadConvIds: [1],
        botUsers: mockBotUsers,
      })
    );

    act(() => {
      result.current.setShowUnreadOnly(true);
    });

    expect(result.current.filteredConversations.length).toBe(1);
    expect(result.current.filteredConversations[0].id).toBe(1);
  });

  it('filters by sidebar tab favorites', () => {
    const { result } = renderHook(() =>
      useChatFilters({
        conversations: mockConversations,
        favorites: [1],
        unreadConvIds: [1],
        botUsers: mockBotUsers,
      })
    );

    act(() => {
      result.current.setSidebarTab('favorites');
    });

    expect(result.current.filteredConversations.length).toBe(1);
    expect(result.current.filteredConversations[0].id).toBe(1);
  });

  it('filters by sidebar tag label', () => {
    const { result } = renderHook(() =>
      useChatFilters({
        conversations: mockConversations,
        favorites: [1],
        unreadConvIds: [1],
        botUsers: mockBotUsers,
      })
    );

    act(() => {
      result.current.setSidebarTab('VIP');
    });

    expect(result.current.filteredConversations.length).toBe(1);
    expect(result.current.filteredConversations[0].id).toBe(1);
  });
});
