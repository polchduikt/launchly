import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNodeHover } from '../useNodeHover';

describe('useNodeHover', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows toolbar after mouse enter delay and hides on mouse leave', () => {
    const { result } = renderHook(() => useNodeHover());

    expect(result.current.showToolbar).toBe(false);

    act(() => {
      result.current.bindHover.onMouseEnter();
    });

    expect(result.current.showToolbar).toBe(false);

    act(() => {
      vi.advanceTimersByTime(50);
    });

    expect(result.current.showToolbar).toBe(true);

    act(() => {
      result.current.bindHover.onMouseLeave();
    });

    act(() => {
      vi.advanceTimersByTime(160);
    });

    expect(result.current.showToolbar).toBe(false);
  });
});
