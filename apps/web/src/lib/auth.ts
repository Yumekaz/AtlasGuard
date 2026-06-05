// apps/web/src/lib/auth.ts
import { apiRequest } from './api';
import { RegisterRequest, RegisterResponse, LoginRequest, LoginResponse } from '@atlasguard/shared';

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: 'TOURIST' | 'OPERATOR' | 'RESPONDER' | 'ADMIN';
}

export function saveSession(token: string, user: UserSession) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  }
}

export function clearSession() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
}

export function getSession(): UserSession | null {
  if (typeof window !== 'undefined') {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (e) {
        return null;
      }
    }
  }
  return null;
}

export function getToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
}

export async function loginUser(data: LoginRequest): Promise<LoginResponse> {
  const res = await apiRequest<LoginResponse>('/auth/login', 'POST', data);
  saveSession(res.token, res.user as any);
  return res;
}

export async function registerUser(data: RegisterRequest): Promise<RegisterResponse> {
  const res = await apiRequest<RegisterResponse>('/auth/register', 'POST', data);
  saveSession(res.token, res.user as any);
  return res;
}

export async function getMe(): Promise<{ user: UserSession }> {
  return apiRequest<{ user: UserSession }>('/auth/me', 'GET');
}
