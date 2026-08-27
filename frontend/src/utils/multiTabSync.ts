export type SyncEventType =
  | 'AUTH_LOGOUT'
  | 'AUTH_LOGIN'
  | 'BOT_CHANGED'
  | 'SYNC_QUERY_INVALIDATE';

export interface SyncMessage<T = unknown> {
  type: SyncEventType;
  payload?: T;
  senderTabId: string;
  timestamp: number;
}

const CHANNEL_NAME = 'launchly_multitab_sync';
const FALLBACK_STORAGE_KEY = 'launchly_multitab_sync_event';

const CURRENT_TAB_ID =
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : Math.random().toString(36).substring(2, 9) + Date.now().toString(36);

let sharedChannel: BroadcastChannel | null = null;

const getChannel = (): BroadcastChannel | null => {
  if (typeof BroadcastChannel === 'undefined') {
    return null;
  }
  if (!sharedChannel) {
    try {
      sharedChannel = new BroadcastChannel(CHANNEL_NAME);
    } catch {
      sharedChannel = null;
    }
  }
  return sharedChannel;
};

export const broadcastEvent = <T = unknown>(type: SyncEventType, payload?: T): void => {
  const message: SyncMessage<T> = {
    type,
    payload,
    senderTabId: CURRENT_TAB_ID,
    timestamp: Date.now(),
  };

  const channel = getChannel();
  if (channel) {
    try {
      channel.postMessage(message);
    } catch {
    }
  }

  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(FALLBACK_STORAGE_KEY, JSON.stringify(message));
    } catch {
    }
  }
};

export const subscribeToSyncEvents = (
  listener: (message: SyncMessage) => void
): (() => void) => {
  const channel = getChannel();

  const handleChannelMessage = (event: MessageEvent<SyncMessage>) => {
    if (!event.data || event.data.senderTabId === CURRENT_TAB_ID) {
      return;
    }
    listener(event.data);
  };

  const handleStorageMessage = (event: StorageEvent) => {
    if (event.key !== FALLBACK_STORAGE_KEY || !event.newValue) {
      return;
    }
    try {
      const message = JSON.parse(event.newValue) as SyncMessage;
      if (message.senderTabId === CURRENT_TAB_ID) {
        return;
      }
      listener(message);
    } catch {
    }
  };

  if (channel) {
    channel.addEventListener('message', handleChannelMessage);
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', handleStorageMessage);
  }

  return () => {
    if (channel) {
      channel.removeEventListener('message', handleChannelMessage);
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', handleStorageMessage);
    }
  };
};

export const getCurrentTabId = (): string => CURRENT_TAB_ID;
