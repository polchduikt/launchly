import { create } from 'zustand';
import { STORAGE_KEYS } from '../const/constants';
import { safeStorage } from '../utils/storage';

export type AppTheme = 'light' | 'yellow' | 'dark';

interface ThemeState {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
}

export const useThemeStore = create<ThemeState>((set) => {
  const savedTheme = safeStorage.getItem(STORAGE_KEYS.THEME) as AppTheme | null;
  const initialTheme: AppTheme = savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'yellow'
    ? savedTheme
    : 'light';

  return {
    theme: initialTheme,
    setTheme: (newTheme: AppTheme) => {
      safeStorage.setItem(STORAGE_KEYS.THEME, newTheme);
      set({ theme: newTheme });
    },
  };
});
