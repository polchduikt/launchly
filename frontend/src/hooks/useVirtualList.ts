import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

export interface UseVirtualListOptions {
  count: number;
  itemHeight: number | ((index: number) => number);
  overscan?: number;
}

export interface VirtualItem {
  index: number;
  offsetTop: number;
  size: number;
}

export interface UseVirtualListResult {
  parentRef: React.RefObject<HTMLDivElement | null>;
  virtualItems: VirtualItem[];
  totalHeight: number;
  scrollToIndex: (index: number, align?: 'start' | 'center' | 'end' | 'auto') => void;
}

export const useVirtualList = ({
  count,
  itemHeight,
  overscan = 3,
}: UseVirtualListOptions): UseVirtualListResult => {
  const parentRef = useRef<HTMLDivElement | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);

  const getItemHeight = useCallback(
    (index: number): number => {
      return typeof itemHeight === 'function' ? itemHeight(index) : itemHeight;
    },
    [itemHeight]
  );

  const { offsets, totalHeight } = useMemo(() => {
    const calculatedOffsets: number[] = new Array(count);
    let currentOffset = 0;

    for (let i = 0; i < count; i++) {
      calculatedOffsets[i] = currentOffset;
      currentOffset += getItemHeight(i);
    }

    return {
      offsets: calculatedOffsets,
      totalHeight: currentOffset,
    };
  }, [count, getItemHeight]);

  useEffect(() => {
    const element = parentRef.current;
    if (!element) return;

    let frameId: number | null = null;

    const handleScroll = () => {
      if (frameId !== null) {
        cancelAnimationFrame(frameId);
      }
      frameId = requestAnimationFrame(() => {
        setScrollTop(element.scrollTop);
      });
    };

    const updateHeight = () => {
      setViewportHeight(element.clientHeight);
    };

    updateHeight();
    setScrollTop(element.scrollTop);

    element.addEventListener('scroll', handleScroll, { passive: true });

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === element) {
          setViewportHeight(entry.contentRect.height);
        }
      }
    });

    resizeObserver.observe(element);

    return () => {
      element.removeEventListener('scroll', handleScroll);
      resizeObserver.disconnect();
      if (frameId !== null) {
        cancelAnimationFrame(frameId);
      }
    };
  }, []);

  const virtualItems = useMemo(() => {
    if (count === 0) {
      return [];
    }

    if (viewportHeight === 0) {
      const initialCount = Math.min(count, Math.max(10, overscan * 2));
      const initialItems: VirtualItem[] = [];
      for (let i = 0; i < initialCount; i++) {
        initialItems.push({
          index: i,
          offsetTop: offsets[i],
          size: getItemHeight(i),
        });
      }
      return initialItems;
    }

    const scrollBottom = scrollTop + viewportHeight;

    let startIndex = 0;
    let low = 0;
    let high = count - 1;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const midOffset = offsets[mid];
      const midSize = getItemHeight(mid);

      if (midOffset + midSize >= scrollTop) {
        startIndex = mid;
        high = mid - 1;
      } else {
        low = mid + 1;
      }
    }

    let endIndex = startIndex;
    low = startIndex;
    high = count - 1;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const midOffset = offsets[mid];

      if (midOffset <= scrollBottom) {
        endIndex = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    startIndex = Math.max(0, startIndex - overscan);
    endIndex = Math.min(count - 1, endIndex + overscan);

    const items: VirtualItem[] = [];
    for (let i = startIndex; i <= endIndex; i++) {
      items.push({
        index: i,
        offsetTop: offsets[i],
        size: getItemHeight(i),
      });
    }

    return items;
  }, [count, viewportHeight, scrollTop, offsets, overscan, getItemHeight]);

  const scrollToIndex = useCallback(
    (index: number, align: 'start' | 'center' | 'end' | 'auto' = 'auto') => {
      const element = parentRef.current;
      if (!element || index < 0 || index >= count) return;

      const itemOffset = offsets[index];
      const itemSize = getItemHeight(index);
      const currentScroll = element.scrollTop;
      const currentHeight = element.clientHeight;

      let targetScroll = itemOffset;

      if (align === 'center') {
        targetScroll = itemOffset - currentHeight / 2 + itemSize / 2;
      } else if (align === 'end') {
        targetScroll = itemOffset - currentHeight + itemSize;
      } else if (align === 'auto') {
        if (itemOffset < currentScroll) {
          targetScroll = itemOffset;
        } else if (itemOffset + itemSize > currentScroll + currentHeight) {
          targetScroll = itemOffset - currentHeight + itemSize;
        } else {
          return;
        }
      }

      element.scrollTop = Math.max(0, Math.min(totalHeight - currentHeight, targetScroll));
    },
    [count, offsets, getItemHeight, totalHeight]
  );

  return {
    parentRef,
    virtualItems,
    totalHeight,
    scrollToIndex,
  };
};
