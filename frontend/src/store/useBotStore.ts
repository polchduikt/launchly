import { create } from 'zustand';
import type { BotState } from '../types/bot';
import { broadcastEvent } from '../utils/multiTabSync';
import { registerAuthCleanup } from './authCleanup';
import { STORAGE_KEYS } from '../const/constants';
import { safeStorage } from '../utils/storage';

export const useBotStore = create<BotState>((set) => {
  const savedActiveBotIdStr = safeStorage.getItem(STORAGE_KEYS.ACTIVE_BOT_ID);
  let savedActiveBotId: number | null = null;

  if (savedActiveBotIdStr) {
    const parsed = parseInt(savedActiveBotIdStr, 10);
    if (!isNaN(parsed)) {
      savedActiveBotId = parsed;
    } else {
      safeStorage.removeItem(STORAGE_KEYS.ACTIVE_BOT_ID);
    }
  }

  return {
    activeBotId: savedActiveBotId,

    setActiveBotId: (id) => {
      if (id !== null) {
        safeStorage.setItem(STORAGE_KEYS.ACTIVE_BOT_ID, String(id));
      } else {
        safeStorage.removeItem(STORAGE_KEYS.ACTIVE_BOT_ID);
      }
      broadcastEvent('BOT_CHANGED', { botId: id });
      set({ activeBotId: id });
    },

    clearBots: () => {
      safeStorage.removeItem(STORAGE_KEYS.ACTIVE_BOT_ID);
      set({ activeBotId: null });
    },
  };
});

registerAuthCleanup(() => {
  useBotStore.getState().clearBots();
});
