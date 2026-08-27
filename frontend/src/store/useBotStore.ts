import { create } from 'zustand';
import type { BotState } from '../types/bot';
import { broadcastEvent } from '../utils/multiTabSync';

export const useBotStore = create<BotState>((set) => {
  const savedActiveBotIdStr = localStorage.getItem('activeBotId');
  let savedActiveBotId: number | null = null;

  if (savedActiveBotIdStr) {
    const parsed = parseInt(savedActiveBotIdStr, 10);
    if (!isNaN(parsed)) {
      savedActiveBotId = parsed;
    } else {
      localStorage.removeItem('activeBotId');
    }
  }

  return {
    activeBotId: savedActiveBotId,

    setActiveBotId: (id) => {
      if (id !== null) {
        localStorage.setItem('activeBotId', String(id));
      } else {
        localStorage.removeItem('activeBotId');
      }
      broadcastEvent('BOT_CHANGED', { botId: id });
      set({ activeBotId: id });
    },

    clearBots: () => {
      localStorage.removeItem('activeBotId');
      set({ activeBotId: null });
    },
  };
});
