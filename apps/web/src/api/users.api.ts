/**
 * API de Usuarios
 * Siguiendo MEJORES_PRACTICAS.md - Separación de concerns
 */
import api from './axios.config';
import {
  User,
  CreateUserPayload,
  UpdateUserPayload,
  SetUserGroupsPayload,
  SetUserActionsPayload,
  ResetPasswordPayload,
} from '@/types/user.types';
import { Action } from '@/types/action.types';

/**
 * Parámetros para listar usuarios con paginación y filtros
 */
export interface GetUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}

/**
 * Respuesta paginada de usuarios
 */
export interface PaginatedUsersResponse {
  data: User[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export const usersApi = {
  /**
   * Listar todos los usuarios con paginación, búsqueda y filtros
   */
  getAll: async (params?: GetUsersParams): Promise<PaginatedUsersResponse> => {
    const response = await api.get<PaginatedUsersResponse>('/users', { params });
    
    // El backend ahora devuelve { data: User[], pagination: {...} }
    return response.data;
  },

  /**
   * Obtener un usuario por ID
   */
  getById: async (id: number): Promise<User> => {
    const response = await api.get<User>(`/users/${id}`);
    return response.data;
  },

  /**
   * Crear un nuevo usuario
   */
  create: async (payload: CreateUserPayload): Promise<User> => {
    const response = await api.post<User>('/users', payload);
    return response.data;
  },

  /**
   * Actualizar un usuario
   */
  update: async (id: number, payload: UpdateUserPayload): Promise<User> => {
    const response = await api.patch<User>(`/users/${id}`, payload);
    return response.data;
  },

  /**
   * Eliminar un usuario
   */
  delete: async (id: number): Promise<void> => {
    await api.delete(`/users/${id}`);
  },

  /**
   * Asignar grupos a un usuario
   */
  setGroups: async (id: number, payload: SetUserGroupsPayload): Promise<User> => {
    const response = await api.patch<User>(`/users/${id}/groups`, payload);
    return response.data;
  },

  /**
   * Asignar acciones a un usuario
   */
  setActions: async (id: number, payload: SetUserActionsPayload): Promise<User> => {
    const response = await api.patch<User>(`/users/${id}/actions`, payload);
    return response.data;
  },

  /**
   * Obtener acciones heredadas de los grupos del usuario
   */
  getInheritedActions: async (id: number): Promise<Action[]> => {
    const response = await api.get<Action[]>(`/users/${id}/inherited-actions`);
    return response.data;
  },

  /**
   * Resetear contraseña de un usuario (admin)
   */
  resetPassword: async (id: number, payload: ResetPasswordPayload): Promise<void> => {
    await api.post(`/users/${id}/reset-password`, payload);
  },
};
