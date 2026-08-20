import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAiAssistant } from '../useAiAssistant';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

vi.mock('../useAiQueries', () => ({
  useAiUsageQuery: () => ({
    data: { tokensRemaining: 500, remainingPercentage: 50 },
    isLoading: false,
    refetch: vi.fn(),
  }),
  useAiChatMutation: () => ({
    mutateAsync: vi.fn().mockResolvedValue({ message: 'AI response' }),
    isPending: false,
  }),
  useAiSchemaMutation: () => ({
    mutateAsync: vi.fn().mockResolvedValue({ nodes: [], edges: [] }),
    isPending: false,
    reset: vi.fn(),
  }),
}));

const mockAddMessage = vi.fn();
const mockSetIsOpen = vi.fn();
const mockSetActiveTab = vi.fn();

vi.mock('../../../store/useAiStore', () => ({
  useAiStore: () => ({
    isOpen: true,
    setIsOpen: mockSetIsOpen,
    messages: [],
    addMessage: mockAddMessage,
    activeTab: 'chat',
    setActiveTab: mockSetActiveTab,
    onGenerate: null,
    hasExistingNodes: false,
  }),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe('useAiAssistant', () => {
  it('initializes with default input state and usage data', () => {
    const { result } = renderHook(() => useAiAssistant(), {
      wrapper: createWrapper(),
    });

    expect(result.current.inputValue).toBe('');
    expect(result.current.isLimitReached).toBe(false);
  });

  it('updates input value and handles send message', async () => {
    const { result } = renderHook(() => useAiAssistant(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.setInputValue('Help me build a bot');
    });

    expect(result.current.inputValue).toBe('Help me build a bot');

    await act(async () => {
      await result.current.handleSend();
    });

    expect(mockAddMessage).toHaveBeenCalled();
  });
});
