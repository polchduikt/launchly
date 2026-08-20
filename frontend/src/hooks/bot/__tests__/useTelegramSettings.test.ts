import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTelegramSettings } from '../useTelegramSettings';

const mockBots = [
  { id: 1, name: 'Support Bot', hasTelegramToken: true, active: true },
  { id: 2, name: 'Lead Bot', hasTelegramToken: true, active: false },
];

vi.mock('../useBotsQuery', () => ({
  useBotsQuery: () => ({ data: mockBots, isLoading: false }),
}));

const mockStart = vi.fn().mockResolvedValue({});
const mockStop = vi.fn().mockResolvedValue({});
const mockDelete = vi.fn().mockResolvedValue({});
const mockUpdate = vi.fn().mockResolvedValue({});

vi.mock('../useBotMutations', () => ({
  useStartBotMutation: () => ({ mutateAsync: mockStart }),
  useStopBotMutation: () => ({ mutateAsync: mockStop }),
  useDeleteBotMutation: () => ({ mutateAsync: mockDelete }),
  useUpdateBotMutation: () => ({ mutateAsync: mockUpdate }),
}));

describe('useTelegramSettings', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('retrieves default bot settings', () => {
    const { result } = renderHook(() => useTelegramSettings());
    const settings = result.current.getBotSettings(1);

    expect(settings.defaultReplyFlow).toBe('Telegram Default Reply');
    expect(settings.welcomeMessageFlow).toBe('Welcome Message');
    expect(settings.optInEnabled).toBe(true);
    expect(settings.optOutEnabled).toBe(true);
  });

  it('updates bot settings and saves to localStorage', () => {
    const { result } = renderHook(() => useTelegramSettings());

    act(() => {
      result.current.updateBotSetting(1, 'optInEnabled', false);
    });

    const updated = result.current.getBotSettings(1);
    expect(updated.optInEnabled).toBe(false);
  });

  it('toggles bot active state', async () => {
    const { result } = renderHook(() => useTelegramSettings());

    await act(async () => {
      await result.current.handleToggleBot(mockBots[0] as unknown as never);
    });

    expect(mockStop).toHaveBeenCalledWith(1);
  });
});
