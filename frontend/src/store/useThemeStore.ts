import { create } from 'zustand';

export type AppTheme = 'yellow' | 'light' | 'dark';

interface ThemeState {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
}

export const useThemeStore = create<ThemeState>((set) => {
  const savedTheme = localStorage.getItem('launchly_theme') as AppTheme | null;
  const initialTheme: AppTheme = savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'yellow'
    ? savedTheme
    : 'yellow';

  return {
    theme: initialTheme,
    setTheme: (newTheme: AppTheme) => {
      localStorage.setItem('launchly_theme', newTheme);
      set({ theme: newTheme });
    },
  };
});
