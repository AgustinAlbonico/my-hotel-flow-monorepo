/**
 * Types de Autenticación
 * Siguiendo MEJORES_PRACTICAS.md - Type safety
 */

export interface User {
  id: number;
  username: string;
  email: string;
  fullName?: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginCredentials {
  identity: string; // username o email
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn?: number;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface RecoverPasswordRequest {
  email: string;
}

export interface RecoverPasswordConfirm {
  token: string;
  newPassword: string;
}

export interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  changePassword: (payload: ChangePasswordPayload) => Promise<void>;
}
