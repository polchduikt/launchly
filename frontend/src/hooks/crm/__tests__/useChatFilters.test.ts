import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useChatFilters } from '../useChatFilters';
import type { ConversationResponse } from '../../../types/crm';
import type { BotUserResponse } from '../../../types/bot';

const mockConversations: ConversationResponse[] = [
  {
    id: 1,
    botId: 1,
    botUserName: 'Alice Smith',
    botUserUsername: 'alice',
    botUserTelegramId: 101,
    status: 'OPEN',
    unread: true,
    lastMessage: 'Hi there',
    lastMessageAt: '2026-08-20T10:00:00Z',
    favorite: true,
  },
  {
    id: 2,
    botId: 1,
    botUserName: 'Bob Johnson',
    botUserUsername: 'bob_j',
    botUserTelegramId: 102,
    status: 'CLOSED',
    unread: false,
    lastMessage: 'Bye',
    lastMessageAt: '2026-08-19T10:00:00Z',
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
    botId: 1,
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

  it('filters by search query', () => {
    const { result } = renderHook(() =>
      useChatFilters({
        conversations: mockConversations,
        favorites: [1],
        unreadConvIds: [1],
        botUsers: mockBotUsers,
      })
    );

    act(() => {
      result.current.setChatFilter('all' as any);
      result.current.setSearchQuery('Bob');
    });

    expect(result.current.filteredConversations.length).toBe(1);
    expect(result.current.filteredConversations[0].botUserName).toBe('Bob Johnson');
  });

  it('filters by favorites tab', () => {
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

  it('resets filters correctly', () => {
    const { result } = renderHook(() =>
      useChatFilters({
        conversations: mockConversations,
        favorites: [1],
        unreadConvIds: [1],
        botUsers: mockBotUsers,
      })
    );

    act(() => {
      result.current.setSearchQuery('xyz');
      result.current.setShowUnreadOnly(true);
      result.current.resetFilters();
    });

    expect(result.current.searchQuery).toBe('');
    expect(result.current.showUnreadOnly).toBe(false);
    expect(result.current.chatFilter).toBe('open');
  });
});
