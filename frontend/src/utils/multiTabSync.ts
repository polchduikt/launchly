export type SyncEventType =
  | 'AUTH_LOGOUT'
  | 'AUTH_LOGIN'
  | 'BOT_CHANGED'
  | 'SYNC_QUERY_INVALIDATE';

export interface SyncMessage<T = unknown> {
  id?: string;
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

// Set of recently processed message IDs to prevent duplicate handling
const recentMessageIds = new Set<string>();

const isDuplicateMessage = (msg: SyncMessage): boolean => {
  const messageKey = msg.id || `${msg.senderTabId}-${msg.timestamp}-${msg.type}`;
  if (recentMessageIds.has(messageKey)) {
    return true;
  }
  recentMessageIds.add(messageKey);
  if (recentMessageIds.size > 100) {
    const oldestKey = recentMessageIds.values().next().value;
    if (oldestKey) recentMessageIds.delete(oldestKey);
  }
  return false;
};

export const broadcastEvent = <T = unknown>(type: SyncEventType, payload?: T): void => {
  const message: SyncMessage<T> = {
    id: `${CURRENT_TAB_ID}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    type,
    payload,
    senderTabId: CURRENT_TAB_ID,
    timestamp: Date.now(),
  };

  const channel = getChannel();
  let channelSuccess = false;
  if (channel) {
    try {
      channel.postMessage(message);
      channelSuccess = true;
    } catch {
      channelSuccess = false;
    }
  }

  // Only broadcast via localStorage fallback if BroadcastChannel is unavailable or failed
  if (!channelSuccess && typeof localStorage !== 'undefined') {
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
    if (isDuplicateMessage(event.data)) {
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
      if (isDuplicateMessage(message)) {
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
