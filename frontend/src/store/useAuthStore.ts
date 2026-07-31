import { create } from 'zustand';
import type { User, AuthState } from '../types/auth';
import { queryClient } from '../api/queryClient';
import { useBotStore } from './useBotStore';

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

    login: (accessToken, refreshToken, user) => {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
      set({
        accessToken,
        refreshToken,
        user,
      });
    },

    logout: () => {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      useBotStore.getState().clearBots();
      queryClient.clear();
      set({
        accessToken: null,
        refreshToken: null,
        user: null,
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
