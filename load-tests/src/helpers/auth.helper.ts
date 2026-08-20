import http from 'k6/http';
import { check } from 'k6';
import { API_ENDPOINTS, ENV } from '../config/env.config';
import { AuthResponse, LoginRequest, RegisterRequest } from '../types/auth.types';

export class AuthHelper {
  static login(email: string, password: string = ENV.DEFAULT_PASSWORD): string | null {
    const payload: LoginRequest = { email, password };
    const res = http.post(API_ENDPOINTS.AUTH.LOGIN, JSON.stringify(payload), {
      headers: { 'Content-Type': 'application/json' },
      tags: { name: 'Auth_Login' },
    });

    const isOk = check(res, {
      'login status is 200': (r) => r.status === 200,
      'has access token': (r) => {
        try {
          const body = JSON.parse(r.body as string) as AuthResponse;
          return !!body.accessToken;
        } catch {
          return false;
        }
      },
    });

    if (isOk) {
      const body = JSON.parse(res.body as string) as AuthResponse;
      return body.accessToken;
    }
    return null;
  }

  static register(email: string, name: string, password: string = ENV.DEFAULT_PASSWORD): string | null {
    const payload: RegisterRequest = { email, name, password };
    const res = http.post(API_ENDPOINTS.AUTH.REGISTER, JSON.stringify(payload), {
      headers: { 'Content-Type': 'application/json' },
      tags: { name: 'Auth_Register' },
    });

    if (res.status === 201 || res.status === 200) {
      const body = JSON.parse(res.body as string) as AuthResponse;
      return body.accessToken;
    }

    return this.login(email, password);
  }

  static getAuthHeaders(token: string): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  }
}
