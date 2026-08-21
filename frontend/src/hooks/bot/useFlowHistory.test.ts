import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFlowHistory } from './useFlowHistory';
import type { Node, Edge } from '@xyflow/react';

describe('useFlowHistory', () => {
  const initialNodes: Node[] = [
    { id: 'node_1', type: 'START', position: { x: 0, y: 0 }, data: {} },
  ];
  const initialEdges: Edge[] = [];

  it('initializes with empty past and future', () => {
    const setNodes = vi.fn();
    const setEdges = vi.fn();
    const setSelectedNodeId = vi.fn();

    const { result } = renderHook(() =>
      useFlowHistory(initialNodes, initialEdges, setNodes, setEdges, setSelectedNodeId)
    );

    expect(result.current.past).toEqual([]);
    expect(result.current.future).toEqual([]);
  });

  it('takes snapshot and updates past', () => {
    const setNodes = vi.fn();
    const setEdges = vi.fn();
    const setSelectedNodeId = vi.fn();

    const { result } = renderHook(() =>
      useFlowHistory(initialNodes, initialEdges, setNodes, setEdges, setSelectedNodeId)
    );

    act(() => {
      result.current.takeSnapshot();
    });

    expect(result.current.past.length).toBe(1);
    expect(result.current.past[0]).toEqual({ nodes: initialNodes, edges: initialEdges });
  });

  it('undo restores previous state and populates future', () => {
    let nodes = initialNodes;
    let edges = initialEdges;
    const setNodes = vi.fn((newNodes) => {
      nodes = typeof newNodes === 'function' ? newNodes(nodes) : newNodes;
    });
    const setEdges = vi.fn((newEdges) => {
      edges = typeof newEdges === 'function' ? newEdges(edges) : newEdges;
    });
    const setSelectedNodeId = vi.fn();

    const { result, rerender } = renderHook(() =>
      useFlowHistory(nodes, edges, setNodes, setEdges, setSelectedNodeId)
    );

    act(() => {
      result.current.takeSnapshot();
    });

    const updatedNodes: Node[] = [
      ...initialNodes,
      { id: 'node_2', type: 'MESSAGE', position: { x: 100, y: 100 }, data: {} },
    ];
    nodes = updatedNodes;
    rerender();

    act(() => {
      result.current.undo();
    });

    expect(setNodes).toHaveBeenCalledWith(initialNodes);
    expect(setSelectedNodeId).toHaveBeenCalledWith(null);
    expect(result.current.future.length).toBe(1);
  });

  it('redo restores future state and pushes to past', () => {
    let nodes = initialNodes;
    let edges = initialEdges;
    const setNodes = vi.fn((newNodes) => {
      nodes = typeof newNodes === 'function' ? newNodes(nodes) : newNodes;
    });
    const setEdges = vi.fn();
    const setSelectedNodeId = vi.fn();

    const { result, rerender } = renderHook(() =>
      useFlowHistory(nodes, edges, setNodes, setEdges, setSelectedNodeId)
    );

    act(() => {
      result.current.takeSnapshot();
    });

    const updatedNodes: Node[] = [
      ...initialNodes,
      { id: 'node_2', type: 'MESSAGE', position: { x: 100, y: 100 }, data: {} },
    ];
    nodes = updatedNodes;
    rerender();

    act(() => {
      result.current.undo();
    });

    act(() => {
      result.current.redo();
    });

    expect(setNodes).toHaveBeenCalledWith(updatedNodes);
    expect(result.current.past.length).toBe(1);
    expect(result.current.future.length).toBe(0);
  });
});
