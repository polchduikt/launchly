import { create } from 'zustand';

interface BotState {
  activeBotId: number | null;
  setActiveBotId: (id: number | null) => void;
  clearBots: () => void;
}

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
      set({ activeBotId: id });
    },

    clearBots: () => {
      localStorage.removeItem('activeBotId');
      set({ activeBotId: null });
    },
  };
});
