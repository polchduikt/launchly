import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import {
  useBotModerationQuery,
  useUpdateBotModerationMutation,
  useTestBotModerationMutation,
} from './useBotModeration';
import * as botApi from '../../api/bot';

vi.mock('../../api/bot', () => ({
  getBotModerationSettingsApi: vi.fn(),
  updateBotModerationSettingsApi: vi.fn(),
  testBotModerationApi: vi.fn(),
}));

describe('useBotModeration', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    React.createElement(QueryClientProvider, { client: queryClient }, children)
  );

  it('fetches moderation settings for botId', async () => {
    const mockRule: botApi.BotModerationRuleDto = {
      id: 1,
      botId: 10,
      enabled: true,
      antiForwardEnabled: true,
      antiLinkEnabled: false,
      defaultProfanityFilter: true,
      mediaMode: 'ALL',
      actionOnViolation: 'DELETE_AND_WARN',
    };
    vi.mocked(botApi.getBotModerationSettingsApi).mockResolvedValue(mockRule);

    const { result } = renderHook(() => useBotModerationQuery(10), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockRule);
    expect(botApi.getBotModerationSettingsApi).toHaveBeenCalledWith(10);
  });

  it('updates moderation settings successfully', async () => {
    const updatedRule: botApi.BotModerationRuleDto = {
      id: 1,
      botId: 10,
      enabled: true,
      antiForwardEnabled: false,
      antiLinkEnabled: true,
      defaultProfanityFilter: true,
      mediaMode: 'TEXT_ONLY',
      actionOnViolation: 'DELETE_ONLY',
    };
    vi.mocked(botApi.updateBotModerationSettingsApi).mockResolvedValue(updatedRule);

    const { result } = renderHook(() => useUpdateBotModerationMutation(10), { wrapper });

    const payload: botApi.UpdateBotModerationRuleRequest = {
      enabled: true,
      antiForwardEnabled: false,
      antiLinkEnabled: true,
      defaultProfanityFilter: true,
      mediaMode: 'TEXT_ONLY',
      actionOnViolation: 'DELETE_ONLY',
    };

    await result.current.mutateAsync(payload);
    expect(botApi.updateBotModerationSettingsApi).toHaveBeenCalledWith(10, payload);
  });

  it('tests moderation rule successfully', async () => {
    const testResponse: botApi.TestModerationResponse = {
      violated: true,
      reasons: ['Stop-Word: badword'],
      matchedStopWord: 'badword',
    };
    vi.mocked(botApi.testBotModerationApi).mockResolvedValue(testResponse);

    const { result } = renderHook(() => useTestBotModerationMutation(10), { wrapper });

    const testPayload: botApi.TestModerationRequest = {
      text: 'badword',
      forwarded: false,
      hasMedia: false,
    };

    const res = await result.current.mutateAsync(testPayload);
    expect(res.violated).toBe(true);
    expect(res.matchedStopWord).toBe('badword');
  });
});
