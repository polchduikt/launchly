import { create } from 'zustand';

export type WebSocketStatus = 'connected' | 'connecting' | 'reconnecting' | 'disconnected';

export interface NetworkState {
  isOnline: boolean;
  webSocketStatus: WebSocketStatus;
  hasBeenOffline: boolean;
  setOnline: (isOnline: boolean) => void;
  setWebSocketStatus: (status: WebSocketStatus) => void;
  setHasBeenOffline: (hasBeenOffline: boolean) => void;
}

export const useNetworkStore = create<NetworkState>((set) => ({
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  webSocketStatus: 'connected',
  hasBeenOffline: false,

  setOnline: (isOnline) =>
    set((state) => ({
      isOnline,
      hasBeenOffline: !isOnline ? true : state.hasBeenOffline,
    })),

  setWebSocketStatus: (status) =>
    set((state) => ({
      webSocketStatus: status,
      hasBeenOffline:
        status === 'disconnected' || status === 'reconnecting'
          ? true
          : state.hasBeenOffline,
    })),

  setHasBeenOffline: (hasBeenOffline) => set({ hasBeenOffline }),
}));
