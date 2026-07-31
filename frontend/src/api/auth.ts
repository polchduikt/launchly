import apiClient from './axios';
import type { AuthResponse, UserResponse, LoginRequest, RegisterRequest } from '../types';

export const loginApi = async (credentials: LoginRequest): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
  return response.data;
};

export const registerApi = async (userData: RegisterRequest): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>('/auth/register', userData);
  return response.data;
};

export const logoutApi = async (refreshToken: string): Promise<void> => {
  await apiClient.post('/auth/logout', { refreshToken });
};

export const getCurrentUserApi = async (): Promise<UserResponse> => {
  const response = await apiClient.get<UserResponse>('/auth/me');
  return response.data;
};

export interface TelegramSessionResponse {
  token: string;
  botUsername: string;
}

export interface TelegramStatusResponse {
  status: 'PENDING' | 'SUCCESS' | 'EXPIRED';
  accessToken: string | null;
  refreshToken: string | null;
  user: UserResponse | null;
}

export const createTelegramSessionApi = async (isSubscription: boolean = false): Promise<TelegramSessionResponse> => {
  const response = await apiClient.post<TelegramSessionResponse>(`/auth/telegram/session?isSubscription=${isSubscription}`);
  return response.data;
};

export const checkTelegramSessionStatusApi = async (token: string): Promise<TelegramStatusResponse> => {
  const response = await apiClient.get<TelegramStatusResponse>(`/auth/telegram/status/${token}`);
  return response.data;
};

export const unlinkTelegramApi = async (): Promise<void> => {
  await apiClient.post('/auth/telegram/unlink');
};

export interface UpdateNotificationsRequest {
  notifyEmail: boolean;
  notifyTelegram: boolean;
  notificationEmail: string | null;
  statsNotificationsEnabled: boolean;
  statsDayOfWeek: string;
  statsHour: number;
  statsDaysRange: number;
  statsNotifyEmail: boolean;
  statsNotifyTelegram: boolean;
}

export const updateNotificationsApi = async (data: UpdateNotificationsRequest): Promise<UserResponse> => {
  const response = await apiClient.put<UserResponse>('/notifications/settings', data);
  return response.data;
};

