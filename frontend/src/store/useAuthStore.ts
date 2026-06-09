import { create } from 'zustand';
import type { User } from '../features/auth/types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  login: (accessToken: string, refreshToken: string, user: User) => void;
  logout: () => void;
  setUser: (user: User) => void;
  setAccessToken: (token: string) => void;
}

export const useAuthStore = create<AuthState>((set) => {
  const savedAccessToken = localStorage.getItem('accessToken');
  const savedRefreshToken = localStorage.getItem('refreshToken');
  const savedUserJson = localStorage.getItem('user');
  
  let savedUser: User | null = null;
  if (savedUserJson) {
    try {
      savedUser = JSON.parse(savedUserJson);
    } catch {
      localStorage.removeItem('user');
    }
  }

  return {
    user: savedUser,
    accessToken: savedAccessToken,
    refreshToken: savedRefreshToken,
    isAuthenticated: !!savedAccessToken,

    login: (accessToken, refreshToken, user) => {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
      set({
        accessToken,
        refreshToken,
        user,
        isAuthenticated: true,
      });
    },

    logout: () => {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      set({
        accessToken: null,
        refreshToken: null,
        user: null,
        isAuthenticated: false,
      });
    },

    setUser: (user) => {
      localStorage.setItem('user', JSON.stringify(user));
      set({ user });
    },

    setAccessToken: (accessToken) => {
      localStorage.setItem('accessToken', accessToken);
      set({ accessToken });
    },
  };
});
