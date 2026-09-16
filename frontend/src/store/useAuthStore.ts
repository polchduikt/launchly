import { create } from 'zustand';
import type { User, AuthState } from '../types/auth';
import { runAuthCleanup } from './authCleanup';
import { broadcastEvent } from '../utils/multiTabSync';
import { STORAGE_KEYS } from '../const/constants';
import { safeStorage } from '../utils/storage';

export const useAuthStore = create<AuthState>((set) => {
  const savedAccessToken = safeStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  const savedRefreshToken = safeStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  const savedUser = safeStorage.getJSON<User | null>(STORAGE_KEYS.USER, null);

  return {
    user: savedUser,
    accessToken: savedAccessToken,
    refreshToken: savedRefreshToken,

    login: (accessToken, refreshToken, user) => {
      safeStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
      safeStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
      safeStorage.setJSON(STORAGE_KEYS.USER, user);
      broadcastEvent('AUTH_LOGIN', { accessToken, refreshToken, user });
      set({
        accessToken,
        refreshToken,
        user,
      });
    },

    logout: () => {
      safeStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      safeStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      safeStorage.removeItem(STORAGE_KEYS.USER);
      runAuthCleanup();
      broadcastEvent('AUTH_LOGOUT');
      set({
        accessToken: null,
        refreshToken: null,
        user: null,
      });
    },

    setUser: (user) => {
      safeStorage.setJSON(STORAGE_KEYS.USER, user);
      set({ user });
    },

    setAccessToken: (accessToken) => {
      safeStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
      set({ accessToken });
    },
  };
});
