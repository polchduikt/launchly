import { create } from 'zustand';
import type { AiState } from '../features/ai/types';

export const useAiStore = create<AiState>((set) => ({
  isOpen: false,
  messages: [],
  setIsOpen: (isOpen) => set({ isOpen }),
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  clearMessages: () => set({ messages: [] }),
}));
