import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  broadcastEvent,
  subscribeToSyncEvents,
  getCurrentTabId,
  type SyncMessage,
} from './multiTabSync';

describe('multiTabSync utility', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('provides a unique tab identifier', () => {
    const tabId = getCurrentTabId();
    expect(tabId).toBeDefined();
    expect(typeof tabId).toBe('string');
    expect(tabId.length).toBeGreaterThan(5);
  });

  it('broadcasts event and notifies storage listener from different tab', () => {
    const mockListener = vi.fn();
    const unsubscribe = subscribeToSyncEvents(mockListener);

    const externalMessage: SyncMessage = {
      type: 'AUTH_LOGOUT',
      payload: { reason: 'session_expired' },
      senderTabId: 'different-tab-id-999',
      timestamp: Date.now(),
    };

    const storageEvent = new StorageEvent('storage', {
      key: 'launchly_multitab_sync_event',
      newValue: JSON.stringify(externalMessage),
    });

    window.dispatchEvent(storageEvent);

    expect(mockListener).toHaveBeenCalledWith(externalMessage);
    unsubscribe();
  });

  it('ignores storage events originating from the same tab', () => {
    const mockListener = vi.fn();
    const unsubscribe = subscribeToSyncEvents(mockListener);

    const sameTabMessage: SyncMessage = {
      type: 'BOT_CHANGED',
      payload: { botId: 5 },
      senderTabId: getCurrentTabId(),
      timestamp: Date.now(),
    };

    const storageEvent = new StorageEvent('storage', {
      key: 'launchly_multitab_sync_event',
      newValue: JSON.stringify(sameTabMessage),
    });

    window.dispatchEvent(storageEvent);

    expect(mockListener).not.toHaveBeenCalled();
    unsubscribe();
  });

  it('broadcasts events to localStorage without throwing', () => {
    expect(() => broadcastEvent('BOT_CHANGED', { botId: 10 })).not.toThrow();
  });
});
