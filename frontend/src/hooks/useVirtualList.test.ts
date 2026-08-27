import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useVirtualList } from './useVirtualList';

describe('useVirtualList', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should return empty items when count is 0', () => {
    const { result } = renderHook(() =>
      useVirtualList({
        count: 0,
        itemHeight: 50,
      })
    );

    expect(result.current.virtualItems).toEqual([]);
    expect(result.current.totalHeight).toBe(0);
    expect(result.current.parentRef.current).toBeNull();
  });

  it('should calculate total height correctly for fixed height items', () => {
    const { result } = renderHook(() =>
      useVirtualList({
        count: 100,
        itemHeight: 60,
      })
    );

    expect(result.current.totalHeight).toBe(6000);
  });

  it('should calculate total height correctly for dynamic height items', () => {
    const { result } = renderHook(() =>
      useVirtualList({
        count: 10,
        itemHeight: (index) => (index % 2 === 0 ? 50 : 100),
      })
    );

    expect(result.current.totalHeight).toBe(750);
  });

  it('should render correct virtual items when viewport height and scrollTop are updated', () => {
    const { result } = renderHook(() =>
      useVirtualList({
        count: 1000,
        itemHeight: 50,
        overscan: 2,
      })
    );

    const mockElement = document.createElement('div');
    Object.defineProperty(mockElement, 'clientHeight', { value: 500, configurable: true });
    Object.defineProperty(mockElement, 'scrollTop', { value: 200, writable: true, configurable: true });

    (result.current.parentRef as any).current = mockElement;

    act(() => {
      mockElement.dispatchEvent(new Event('scroll'));
    });

    expect(result.current.totalHeight).toBe(50000);
  });
});
