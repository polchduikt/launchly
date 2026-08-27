import { describe, it, expect, beforeEach } from 'vitest';
import { useNetworkStore } from './useNetworkStore';

describe('useNetworkStore', () => {
  beforeEach(() => {
    useNetworkStore.setState({
      isOnline: true,
      webSocketStatus: 'connected',
      hasBeenOffline: false,
    });
  });

  it('initializes with online and connected status', () => {
    const state = useNetworkStore.getState();
    expect(state.isOnline).toBe(true);
    expect(state.webSocketStatus).toBe('connected');
    expect(state.hasBeenOffline).toBe(false);
  });

  it('updates isOnline and tracks hasBeenOffline flag', () => {
    useNetworkStore.getState().setOnline(false);
    let state = useNetworkStore.getState();
    expect(state.isOnline).toBe(false);
    expect(state.hasBeenOffline).toBe(true);

    useNetworkStore.getState().setOnline(true);
    state = useNetworkStore.getState();
    expect(state.isOnline).toBe(true);
    expect(state.hasBeenOffline).toBe(true);
  });

  it('updates webSocketStatus correctly', () => {
    useNetworkStore.getState().setWebSocketStatus('reconnecting');
    let state = useNetworkStore.getState();
    expect(state.webSocketStatus).toBe('reconnecting');
    expect(state.hasBeenOffline).toBe(true);

    useNetworkStore.getState().setWebSocketStatus('connected');
    state = useNetworkStore.getState();
    expect(state.webSocketStatus).toBe('connected');
  });

  it('allows manual reset of hasBeenOffline flag', () => {
    useNetworkStore.getState().setOnline(false);
    expect(useNetworkStore.getState().hasBeenOffline).toBe(true);

    useNetworkStore.getState().setHasBeenOffline(false);
    expect(useNetworkStore.getState().hasBeenOffline).toBe(false);
  });
});
