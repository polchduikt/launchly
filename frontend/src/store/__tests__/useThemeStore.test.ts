import { describe, it, expect, beforeEach } from 'vitest';
import { useThemeStore } from '../useThemeStore';

describe('useThemeStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useThemeStore.getState().setTheme('yellow');
  });

  it('defaults to yellow theme', () => {
    expect(useThemeStore.getState().theme).toBe('yellow');
  });

  it('changes and persists theme in localStorage', () => {
    useThemeStore.getState().setTheme('dark');
    expect(useThemeStore.getState().theme).toBe('dark');
    expect(localStorage.getItem('launchly_theme')).toBe('dark');

    useThemeStore.getState().setTheme('light');
    expect(useThemeStore.getState().theme).toBe('light');
    expect(localStorage.getItem('launchly_theme')).toBe('light');
  });
});
