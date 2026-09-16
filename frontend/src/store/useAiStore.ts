import { create } from 'zustand';
import type { AiState } from '../types/ai';

export const useAiStore = create<AiState>((set) => ({
  isOpen: false,
  activeTab: 'chat',
  onGenerate: null,
  hasExistingNodes: false,

  setIsOpen: (isOpen) => set({ isOpen }),
  setActiveTab: (activeTab) => set({ activeTab }),
  setOnGenerate: (onGenerate) => set({ onGenerate }),
  setHasExistingNodes: (hasExistingNodes) => set({ hasExistingNodes }),
}));

