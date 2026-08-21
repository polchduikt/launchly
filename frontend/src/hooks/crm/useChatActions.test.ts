import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useChatActions } from './useChatActions';

const mockMutate = vi.fn();
vi.mock('./useCrmQueries', () => ({
  useSendMessageMutation: () => ({ mutate: mockMutate }),
}));

const mockMediaUpload = vi.fn().mockResolvedValue({ url: 'https://example.com/photo.jpg' });
vi.mock('../bot/useMediaUpload', () => ({
  useMediaUpload: () => ({ mutateAsync: mockMediaUpload }),
}));

describe('useChatActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sends typed text message and resets input', () => {
    const { result } = renderHook(() =>
      useChatActions({ selectedConvId: 10, botId: 1 })
    );

    act(() => {
      result.current.setTypedMessage('Hello world!');
    });

    act(() => {
      result.current.handleSend();
    });

    expect(mockMutate).toHaveBeenCalledWith({
      content: 'Hello world!',
      mediaUrl: undefined,
      mediaType: undefined,
    });
    expect(result.current.typedMessage).toBe('');
  });

  it('schedules message sending', () => {
    const { result } = renderHook(() =>
      useChatActions({ selectedConvId: 10, botId: 1 })
    );

    act(() => {
      result.current.setTypedMessage('Scheduled ping');
    });

    act(() => {
      result.current.handleScheduleSend('2026-08-25T12:00:00Z');
    });

    expect(mockMutate).toHaveBeenCalledWith({
      content: 'Scheduled ping',
      mediaUrl: undefined,
      mediaType: undefined,
      scheduledAt: '2026-08-25T12:00:00Z',
    });
  });

  it('appends selected emoji to message text', () => {
    const { result } = renderHook(() =>
      useChatActions({ selectedConvId: 10, botId: 1 })
    );

    act(() => {
      result.current.setTypedMessage('Nice ');
      result.current.handleEmojiSelect({ native: '🚀' });
    });

    expect(result.current.typedMessage).toBe('Nice 🚀');
    expect(result.current.showEmojiPicker).toBe(false);
  });
});
