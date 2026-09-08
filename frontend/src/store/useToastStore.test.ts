import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useToastStore, toast } from './useToastStore';

describe('useToastStore', () => {
  beforeEach(() => {
    useToastStore.getState().clearToasts();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('adds a toast correctly', () => {
    const id = toast.success('Operation succeeded');
    const state = useToastStore.getState();
    expect(state.toasts).toHaveLength(1);
    expect(state.toasts[0].id).toBe(id);
    expect(state.toasts[0].message).toBe('Operation succeeded');
    expect(state.toasts[0].type).toBe('success');
  });

  it('dismisses a toast by id', () => {
    const id = toast.error('Error occurred');
    expect(useToastStore.getState().toasts).toHaveLength(1);

    toast.dismiss(id);
    expect(useToastStore.getState().toasts).toHaveLength(0);
  });

  it('deduplicates identical messages within 1.5s', () => {
    const id1 = toast.error('Duplicate error');
    const id2 = toast.error('Duplicate error');

    expect(id1).toBe(id2);
    expect(useToastStore.getState().toasts).toHaveLength(1);

    // After 2 seconds, same message should create a new toast
    vi.advanceTimersByTime(2000);
    const id3 = toast.error('Duplicate error');
    expect(id3).not.toBe(id1);
    expect(useToastStore.getState().toasts).toHaveLength(2);
  });

  it('supports info and warning helpers', () => {
    toast.info('Info note');
    toast.warning('Warning note');

    const state = useToastStore.getState();
    expect(state.toasts).toHaveLength(2);
    expect(state.toasts[0].type).toBe('info');
    expect(state.toasts[1].type).toBe('warning');
  });

  it('clears all toasts', () => {
    toast.info('A');
    toast.info('B');
    expect(useToastStore.getState().toasts).toHaveLength(2);

    toast.clear();
    expect(useToastStore.getState().toasts).toHaveLength(0);
  });
});
