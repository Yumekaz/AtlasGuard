export type UserRole = 'TOURIST' | 'OPERATOR' | 'RESPONDER' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: 'ACTIVE' | 'SUSPENDED';
  createdAt: string;
  updatedAt: string;
}

export interface RegisterRequest {
  email: string;
  password?: string;
  name: string;
  role: UserRole;
}

export interface RegisterResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
  };
  token: string;
}

export interface LoginRequest {
  email: string;
  password?: string;
}

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
  };
  token: string;
}
