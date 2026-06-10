import { create } from 'zustand';
import type { BotResponse } from '../types/bot';

interface BotState {
  bots: BotResponse[];
  activeBot: BotResponse | null;
  setBots: (bots: BotResponse[]) => void;
  setActiveBot: (bot: BotResponse | null) => void;
  clearBots: () => void;
}

export const useBotStore = create<BotState>((set) => {
  const savedActiveBotJson = localStorage.getItem('activeBot');
  let savedActiveBot: BotResponse | null = null;
  
  if (savedActiveBotJson) {
    try {
      savedActiveBot = JSON.parse(savedActiveBotJson);
    } catch {
      localStorage.removeItem('activeBot');
    }
  }

  return {
    bots: [],
    activeBot: savedActiveBot,

    setBots: (bots) => {
      set((state) => {
        let newActiveBot = state.activeBot;
        if (bots.length === 0) {
          newActiveBot = null;
          localStorage.removeItem('activeBot');
        } else if (!state.activeBot || !bots.some((b) => b.id === state.activeBot?.id)) {
          newActiveBot = bots[0];
          localStorage.setItem('activeBot', JSON.stringify(bots[0]));
        } else {
          const updatedActive = bots.find((b) => b.id === state.activeBot?.id);
          if (updatedActive) {
            newActiveBot = updatedActive;
            localStorage.setItem('activeBot', JSON.stringify(updatedActive));
          }
        }
        return { bots, activeBot: newActiveBot };
      });
    },

    setActiveBot: (bot) => {
      if (bot) {
        localStorage.setItem('activeBot', JSON.stringify(bot));
      } else {
        localStorage.removeItem('activeBot');
      }
      set({ activeBot: bot });
    },

    clearBots: () => {
      localStorage.removeItem('activeBot');
      set({ bots: [], activeBot: null });
    },
  };
});
