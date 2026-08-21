import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useNodePerformance, useNodePerformanceAction } from './useNodePerformance';

vi.mock('@xyflow/react', () => ({
  useNodeConnections: ({ handleType }: { handleType: string }) => {
    if (handleType === 'source') {
      return [{ sourceHandle: 'handle_1', source: 'node_1' }];
    }
    return [{ source: 'node_0', target: 'node_1' }];
  },
  useConnection: () => ({
    inProgress: false,
    fromNode: null,
    fromHandle: null,
  }),
}));

describe('useNodePerformance', () => {
  it('computes source and target connections correctly', () => {
    const { result } = renderHook(() => useNodePerformance('node_1'));

    expect(result.current.isSourceHandleConnected('handle_1')).toBe(true);
    expect(result.current.isSourceHandleConnected('non_existent')).toBe(false);
    expect(result.current.isTargetConnected).toBe(true);
    expect(result.current.isGrayedOut).toBe(false);
  });
});

describe('useNodePerformanceAction', () => {
  it('computes connections for action node correctly', () => {
    const { result } = renderHook(() => useNodePerformanceAction('node_1'));

    expect(result.current.isSourceHandleConnected('handle_1')).toBe(true);
    expect(result.current.isTargetConnected).toBe(true);
    expect(result.current.isGrayedOut).toBe(false);
  });
});
