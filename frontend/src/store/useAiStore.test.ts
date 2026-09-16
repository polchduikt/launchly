import { describe, it, expect, beforeEach } from 'vitest';
import { useAiStore } from './useAiStore';

describe('useAiStore', () => {
  beforeEach(() => {
    useAiStore.getState().setIsOpen(false);
    useAiStore.getState().setActiveTab('chat');
    useAiStore.getState().setOnGenerate(null);
    useAiStore.getState().setHasExistingNodes(false);
  });

  it('initializes with default drawer state', () => {
    const state = useAiStore.getState();
    expect(state.isOpen).toBe(false);
    expect(state.activeTab).toBe('chat');
    expect(state.onGenerate).toBeNull();
    expect(state.hasExistingNodes).toBe(false);
  });

  it('updates drawer open and tab state', () => {
    useAiStore.getState().setIsOpen(true);
    expect(useAiStore.getState().isOpen).toBe(true);

    useAiStore.getState().setActiveTab('generator');
    expect(useAiStore.getState().activeTab).toBe('generator');

    useAiStore.getState().setHasExistingNodes(true);
    expect(useAiStore.getState().hasExistingNodes).toBe(true);
  });
});
