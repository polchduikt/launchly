import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from './useAuthStore';
import type { User } from '../types/auth';

describe('useAuthStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.getState().logout();
  });

  const mockUser: User = {
    id: 1,
    email: 'alex@launchly.com',
    name: 'Alex Dev',
    avatar: null,
    role: 'ROLE_OWNER',
    telegramUserId: null,
    telegramUsername: null,
    telegramName: null,
    telegramPhotoUrl: null,
    notifyEmail: true,
    notifyTelegram: false,
    notificationEmail: null,
    statsNotificationsEnabled: false,
    statsDayOfWeek: 'MONDAY',
    statsHour: 9,
    statsDaysRange: 7,
    statsNotifyEmail: false,
    statsNotifyTelegram: false,
    timezone: 'UTC',
  };

  it('initializes with null credentials when localStorage is empty', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.refreshToken).toBeNull();
  });

  it('updates state and localStorage on login', () => {
    useAuthStore.getState().login('access_jwt_123', 'refresh_jwt_456', mockUser);

    const state = useAuthStore.getState();
    expect(state.accessToken).toBe('access_jwt_123');
    expect(state.refreshToken).toBe('refresh_jwt_456');
    expect(state.user).toEqual(mockUser);

    expect(localStorage.getItem('accessToken')).toBe('access_jwt_123');
    expect(localStorage.getItem('refreshToken')).toBe('refresh_jwt_456');
    expect(JSON.parse(localStorage.getItem('user')!)).toEqual(mockUser);
  });

  it('clears state and localStorage on logout', () => {
    useAuthStore.getState().login('access_123', 'refresh_456', mockUser);
    useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.accessToken).toBeNull();
    expect(state.refreshToken).toBeNull();
    expect(state.user).toBeNull();

    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem('refreshToken')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });

  it('updates accessToken individually', () => {
    useAuthStore.getState().setAccessToken('new_rotated_token');
    expect(useAuthStore.getState().accessToken).toBe('new_rotated_token');
    expect(localStorage.getItem('accessToken')).toBe('new_rotated_token');
  });
});
