/**
 * API de Autenticación
 * Siguiendo MEJORES_PRACTICAS.md - Separación de concerns
 */
import api from './axios.config';
import {
  LoginCredentials,
  LoginResponse,
  ChangePasswordPayload,
  RecoverPasswordRequest,
  RecoverPasswordConfirm,
  User,
} from '@/types/auth.types';

export const authApi = {
  /**
   * Login con credenciales (username/email + password)
   */
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/auth/login', credentials);
    return response.data;
  },

  /**
   * Refresh access token
   */
  refresh: async (refreshToken: string): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/auth/refresh', {
      refreshToken,
    });
    return response.data;
  },

  /**
   * Logout (revocar tokens en el servidor)
   */
  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },

  /**
   * Obtener perfil del usuario autenticado
   */
  getProfile: async (): Promise<User> => {
    const response = await api.get<User>('/auth/me');
    return response.data;
  },

  /**
   * Cambiar contraseña del usuario autenticado
   */
  changePassword: async (payload: ChangePasswordPayload): Promise<void> => {
    await api.patch('/auth/password', payload);
  },

  /**
   * Solicitar recuperación de contraseña
   */
  recoverRequest: async (payload: RecoverPasswordRequest): Promise<void> => {
    await api.post('/auth/recover/request', payload);
  },

  /**
   * Confirmar recuperación de contraseña con token
   */
  recoverConfirm: async (payload: RecoverPasswordConfirm): Promise<void> => {
    await api.post('/auth/recover/confirm', payload);
  },
};
