/**
 * API de Grupos
 * Siguiendo MEJORES_PRACTICAS.md - Separación de concerns
 */
import api from './axios.config';
import {
  Group,
  CreateGroupPayload,
  UpdateGroupPayload,
  SetGroupActionsPayload,
  SetGroupChildrenPayload,
} from '@/types/group.types';

export const groupsApi = {
  /**
   * Listar todos los grupos
   */
  getAll: async (): Promise<Group[]> => {
    const response = await api.get<Group[]>('/groups');
    return response.data;
  },

  /**
   * Obtener un grupo por ID
   */
  getById: async (id: number): Promise<Group> => {
    const response = await api.get<Group>(`/groups/${id}`);
    return response.data;
  },

  /**
   * Crear un nuevo grupo
   */
  create: async (payload: CreateGroupPayload): Promise<Group> => {
    const response = await api.post<Group>('/groups', payload);
    return response.data;
  },

  /**
   * Actualizar un grupo
   */
  update: async (id: number, payload: UpdateGroupPayload): Promise<Group> => {
    const response = await api.patch<Group>(`/groups/${id}`, payload);
    return response.data;
  },

  /**
   * Eliminar un grupo
   */
  delete: async (id: number): Promise<void> => {
    await api.delete(`/groups/${id}`);
  },

  /**
   * Asignar acciones a un grupo
   */
  setActions: async (id: number, payload: SetGroupActionsPayload): Promise<Group> => {
    const response = await api.patch<Group>(`/groups/${id}/actions`, payload);
    return response.data;
  },

  /**
   * Asignar grupos hijos a un grupo
   */
  setChildren: async (id: number, payload: SetGroupChildrenPayload): Promise<Group> => {
    const response = await api.patch<Group>(`/groups/${id}/children`, payload);
    return response.data;
  },
};
