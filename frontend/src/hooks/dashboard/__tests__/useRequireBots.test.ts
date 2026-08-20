import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useRequireBots } from '../useRequireBots';

vi.mock('../../bot/useBotsQuery', () => ({
  useBotsQuery: () => ({
    data: [{ id: 1, name: 'Bot 1' }],
    isLoading: false,
  }),
}));

vi.mock('../../../store/useAuthStore', () => ({
  useAuthStore: (selector: any) =>
    selector ? selector({ user: { role: 'ROLE_USER' } }) : { user: { role: 'ROLE_USER' } },
}));

describe('useRequireBots', () => {
  it('returns true for hasBots when user has bots available', () => {
    const { result } = renderHook(() => useRequireBots());

    expect(result.current.isLoading).toBe(false);
    expect(result.current.hasBots).toBe(true);
  });
});
