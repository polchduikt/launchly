import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFlowCollaboration } from './useFlowCollaboration';

const mockAuthState = {
  user: { id: 1, name: 'Alice' },
  accessToken: 'mock_access_token',
};

vi.mock('@stomp/stompjs', () => {
  class MockClient {
    activate = vi.fn();
    deactivate = vi.fn();
    publish = vi.fn();
    subscribe = vi.fn();
  }
  return {
    Client: MockClient,
  };
});

vi.mock('../../store/useAuthStore', () => {
  const useAuthStoreMock = (selector?: (state: Record<string, unknown>) => unknown) =>
    selector ? selector(mockAuthState) : mockAuthState;
  useAuthStoreMock.getState = () => mockAuthState;
  return { useAuthStore: useAuthStoreMock };
});

describe('useFlowCollaboration', () => {
  it('initializes with empty collaborators and allows local action update', () => {
    const setNodes = vi.fn();
    const setEdges = vi.fn();

    const { result } = renderHook(() =>
      useFlowCollaboration(1, [], [], setNodes, setEdges, 'flow')
    );

    expect(result.current.collaborators).toEqual([]);

    act(() => {
      result.current.updateLocalAction('editing', 'node_1');
    });

    expect(result.current.collaborators).toBeDefined();
  });
});
