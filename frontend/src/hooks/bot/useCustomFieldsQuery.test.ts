import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useCustomFieldsQuery } from './useCustomFieldsQuery';
import * as botApi from '../../api/bot';

vi.mock('../../api/bot', () => ({
  getCustomFieldsApi: vi.fn(),
  saveCustomFieldsApi: vi.fn(),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe('useCustomFieldsQuery', () => {
  it('does not fetch when botId is 0 or null', () => {
    const { result } = renderHook(() => useCustomFieldsQuery(0), {
      wrapper: createWrapper(),
    });
    expect(result.current.isLoading).toBe(false);
    expect(botApi.getCustomFieldsApi).not.toHaveBeenCalled();
  });

  it('fetches custom fields when botId is positive', async () => {
    vi.mocked(botApi.getCustomFieldsApi).mockResolvedValueOnce({
      fields: [{ name: 'phone', type: 'Text' }],
    });

    const { result } = renderHook(() => useCustomFieldsQuery(42), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.fields).toEqual([{ name: 'phone', type: 'Text' }]);
  });
});
