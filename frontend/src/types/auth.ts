import React from 'react';
import type { UseFormRegisterReturn } from 'react-hook-form';

import type { UserRole } from '../enums/auth.enums';
export type { UserRole };

export interface User {
  id: number;
  email: string;
  name: string;
  avatar: string | null;
  role: UserRole | string;
  telegramUserId: number | null;
  telegramUsername: string | null;
  telegramName: string | null;
  telegramPhotoUrl: string | null;
  provider?: string | null;
  notifyEmail: boolean;
  notifyTelegram: boolean;
  notificationEmail: string | null;
  statsNotificationsEnabled: boolean;
  statsDayOfWeek: string;
  statsHour: number;
  statsDaysRange: number;
  statsNotifyEmail: boolean;
  statsNotifyTelegram: boolean;
  timezone: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export type UserResponse = User;

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  login: (accessToken: string, refreshToken: string, user: User) => void;
  logout: () => void;
  setUser: (user: User) => void;
  setAccessToken: (token: string) => void;
}

export interface AuthPageLayoutProps {
  leftTitle?: string;
  leftDescription?: string;
  rightContent: React.ReactNode;
}

export interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: React.ReactNode;
  error?: string;
  registration: Partial<UseFormRegisterReturn>;
  rightElement?: React.ReactNode;
}

export interface GoogleLoginButtonProps {
  onClick: () => void;
}
