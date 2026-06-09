import apiClient from '../../../lib/axios';
import type { AuthResponse, UserResponse } from '../types';

export const loginApi = async (credentials: any): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
  return response.data;
};

export const registerApi = async (userData: any): Promise<AuthResponse> => {
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
