import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFlowAutoSave } from '../useFlowAutoSave';
import type { Node, Edge } from '@xyflow/react';

describe('useFlowAutoSave', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const nodes: Node[] = [
    { id: 'start_1', type: 'START', position: { x: 0, y: 0 }, data: {} },
  ];
  const edges: Edge[] = [];

  it('marks initial load done without triggering immediate save', () => {
    const saveMutation = { mutate: vi.fn() };
    const { result } = renderHook(() =>
      useFlowAutoSave(1, nodes, edges, false, saveMutation)
    );

    expect(result.current.isInitialLoadDoneRef.current).toBe(true);
    expect(result.current.isDirty).toBe(false);
    expect(saveMutation.mutate).not.toHaveBeenCalled();
  });

  it('sets isDirty when nodes change and triggers debounced save', () => {
    const saveMutation = { mutate: vi.fn() };
    let currentNodes = nodes;

    const { result, rerender } = renderHook(() =>
      useFlowAutoSave(1, currentNodes, edges, false, saveMutation)
    );

    currentNodes = [
      ...nodes,
      { id: 'msg_1', type: 'MESSAGE', position: { x: 100, y: 100 }, data: { label: 'Hello' } },
    ];
    rerender();

    expect(result.current.isDirty).toBe(true);

    act(() => {
      vi.advanceTimersByTime(1500);
    });

    expect(saveMutation.mutate).toHaveBeenCalledWith({
      nodes: currentNodes,
      edges,
    });
    expect(result.current.isDirty).toBe(false);
  });
});
