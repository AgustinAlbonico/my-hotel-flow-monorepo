/**
 * API de Acciones (Permisos)
 * Siguiendo MEJORES_PRACTICAS.md - Separación de concerns
 */
import api from './axios.config';
import {
  Action,
  CreateActionPayload,
  UpdateActionPayload,
} from '@/types/action.types';

export const actionsApi = {
  /**
   * Listar todas las acciones
   */
  getAll: async (): Promise<Action[]> => {
    const response = await api.get<Action[]>('/actions');
    return response.data;
  },

  /**
   * Obtener una acción por ID
   */
  getById: async (id: number): Promise<Action> => {
    const response = await api.get<Action>(`/actions/${id}`);
    return response.data;
  },

  /**
   * Crear una nueva acción
   */
  create: async (payload: CreateActionPayload): Promise<Action> => {
    const response = await api.post<Action>('/actions', payload);
    return response.data;
  },

  /**
   * Actualizar una acción
   */
  update: async (id: number, payload: UpdateActionPayload): Promise<Action> => {
    const response = await api.patch<Action>(`/actions/${id}`, payload);
    return response.data;
  },

  /**
   * Eliminar una acción
   */
  delete: async (id: number): Promise<void> => {
    await api.delete(`/actions/${id}`);
  },
};
