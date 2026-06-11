export interface User {
  id: number;
  email: string;
  name: string;
  avatar: string | null;
  role: string;
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
