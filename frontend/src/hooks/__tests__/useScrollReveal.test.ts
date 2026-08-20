import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useScrollReveal } from '../useScrollReveal';

describe('useScrollReveal', () => {
  let mockObserve: any;
  let mockUnobserve: any;
  let mockDisconnect: any;

  beforeEach(() => {
    mockObserve = vi.fn();
    mockUnobserve = vi.fn();
    mockDisconnect = vi.fn();

    class MockIntersectionObserver {
      observe = mockObserve;
      unobserve = mockUnobserve;
      disconnect = mockDisconnect;
    }

    window.IntersectionObserver = MockIntersectionObserver as any;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('observes matching scroll elements on mount and disconnects on unmount', () => {
    const div = document.createElement('div');
    div.className = 'reveal-on-scroll';
    document.body.appendChild(div);

    const { unmount } = renderHook(() => useScrollReveal());

    expect(mockObserve).toHaveBeenCalledWith(div);

    unmount();

    expect(mockDisconnect).toHaveBeenCalled();

    document.body.removeChild(div);
  });
});
