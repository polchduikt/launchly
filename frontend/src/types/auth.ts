export interface User {
  id: number;
  email: string;
  name: string;
  avatar: string | null;
  role: string;
  telegramUserId: number | null;
  telegramUsername: string | null;
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

