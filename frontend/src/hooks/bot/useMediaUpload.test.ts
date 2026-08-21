import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useMediaUpload } from './useMediaUpload';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

vi.mock('../../api/axios', () => ({
  default: {
    post: vi.fn().mockResolvedValue({
      data: { url: 'https://cdn.example.com/image.png', publicId: 'img_123' },
    }),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe('useMediaUpload', () => {
  it('uploads file and returns media url and publicId', async () => {
    const { result } = renderHook(() => useMediaUpload('avatars'), {
      wrapper: createWrapper(),
    });

    const file = new File(['content'], 'avatar.png', { type: 'image/png' });
    const res = await result.current.mutateAsync(file);

    expect(res).toEqual({
      url: 'https://cdn.example.com/image.png',
      publicId: 'img_123',
    });
  });
});
