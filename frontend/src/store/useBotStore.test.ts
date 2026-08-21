import { describe, it, expect, beforeEach } from 'vitest';
import { useBotStore } from './useBotStore';

describe('useBotStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useBotStore.getState().clearBots();
  });

  it('initializes with null activeBotId when localStorage is empty', () => {
    const state = useBotStore.getState();
    expect(state.activeBotId).toBeNull();
  });

  it('sets and persists activeBotId in localStorage', () => {
    useBotStore.getState().setActiveBotId(42);
    expect(useBotStore.getState().activeBotId).toBe(42);
    expect(localStorage.getItem('activeBotId')).toBe('42');
  });

  it('removes activeBotId from localStorage when set to null', () => {
    useBotStore.getState().setActiveBotId(42);
    useBotStore.getState().setActiveBotId(null);
    expect(useBotStore.getState().activeBotId).toBeNull();
    expect(localStorage.getItem('activeBotId')).toBeNull();
  });

  it('clears bots completely', () => {
    useBotStore.getState().setActiveBotId(100);
    useBotStore.getState().clearBots();
    expect(useBotStore.getState().activeBotId).toBeNull();
    expect(localStorage.getItem('activeBotId')).toBeNull();
  });
});
