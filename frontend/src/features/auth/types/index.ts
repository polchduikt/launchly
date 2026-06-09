export interface User {
  id: number;
  email: string;
  name: string;
  avatar: string | null;
  role: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface UserResponse {
  id: number;
  email: string;
  name: string;
  avatar: string | null;
  role: string;
}
