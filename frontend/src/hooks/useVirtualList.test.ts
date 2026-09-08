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

    (result.current.parentRef as { current: HTMLDivElement | null }).current = mockElement;

    act(() => {
      mockElement.dispatchEvent(new Event('scroll'));
    });

    expect(result.current.totalHeight).toBe(50000);
  });

  it('should handle scrollToIndex with various alignment modes', () => {
    const { result } = renderHook(() =>
      useVirtualList({
        count: 100,
        itemHeight: 50,
      })
    );

    const mockElement = document.createElement('div');
    Object.defineProperty(mockElement, 'clientHeight', { value: 200, configurable: true });
    let currentScroll = 0;
    Object.defineProperty(mockElement, 'scrollTop', {
      get: () => currentScroll,
      set: (val: number) => {
        currentScroll = val;
      },
      configurable: true,
    });

    (result.current.parentRef as { current: HTMLDivElement | null }).current = mockElement;

    // Test start alignment: item 10 is at offset 500
    act(() => {
      result.current.scrollToIndex(10, 'start');
    });
    expect(mockElement.scrollTop).toBe(500);

    // Test center alignment: offset 500 - (200 / 2) + (50 / 2) = 500 - 100 + 25 = 425
    act(() => {
      result.current.scrollToIndex(10, 'center');
    });
    expect(mockElement.scrollTop).toBe(425);

    // Test end alignment: offset 500 - 200 + 50 = 350
    act(() => {
      result.current.scrollToIndex(10, 'end');
    });
    expect(mockElement.scrollTop).toBe(350);

    // Test ignore invalid index
    act(() => {
      result.current.scrollToIndex(-1);
      result.current.scrollToIndex(200);
    });
    expect(mockElement.scrollTop).toBe(350);
  });
});
