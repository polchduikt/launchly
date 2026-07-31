import { create } from 'zustand';
import type { AiState } from '../types/ai';

export const useAiStore = create<AiState>((set) => ({
  isOpen: false,
  messages: [
    {
      role: 'assistant',
      content:
        'Hello! I am your Launchly AI Assistant. I can help you design bot flows, explain how different nodes work, configure CRM settings, or set up Google Sheets integration. How can I help you today?',
    },
  ],
  activeTab: 'chat',
  onGenerate: null,
  hasExistingNodes: false,
  setIsOpen: (isOpen) => set({ isOpen }),
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  clearMessages: () =>
    set({
      messages: [
        {
          role: 'assistant',
          content:
            'Hello! I am your Launchly AI Assistant. I can help you design bot flows, explain how different nodes work, configure CRM settings, or set up Google Sheets integration. How can I help you today?',
        },
      ],
    }),
  setActiveTab: (activeTab) => set({ activeTab }),
  setOnGenerate: (onGenerate) => set({ onGenerate }),
  setHasExistingNodes: (hasExistingNodes) => set({ hasExistingNodes }),
}));
