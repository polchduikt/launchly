import { describe, it, expect, beforeEach } from 'vitest';
import { useAiStore } from '../useAiStore';

describe('useAiStore', () => {
  beforeEach(() => {
    useAiStore.getState().clearMessages();
    useAiStore.getState().setIsOpen(false);
    useAiStore.getState().setActiveTab('chat');
  });

  it('initializes with default welcome message and closed drawer', () => {
    const state = useAiStore.getState();
    expect(state.isOpen).toBe(false);
    expect(state.messages.length).toBe(1);
    expect(state.messages[0].role).toBe('assistant');
  });

  it('adds and clears chat messages', () => {
    useAiStore.getState().addMessage({
      role: 'user',
      content: 'How do I add a Delay node?',
    });

    expect(useAiStore.getState().messages.length).toBe(2);
    expect(useAiStore.getState().messages[1].content).toBe('How do I add a Delay node?');

    useAiStore.getState().clearMessages();
    expect(useAiStore.getState().messages.length).toBe(1);
  });

  it('toggles drawer visibility and active tabs', () => {
    useAiStore.getState().setIsOpen(true);
    expect(useAiStore.getState().isOpen).toBe(true);

    useAiStore.getState().setActiveTab('generator');
    expect(useAiStore.getState().activeTab).toBe('generator');
  });
});
