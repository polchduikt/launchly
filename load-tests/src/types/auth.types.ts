export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

export interface UserProfileResponse {
  id: string;
  email: string;
  name: string;
  role: string;
  avatarUrl?: string;
  createdAt: string;
}
