/**
 * API de Permisos
 * Siguiendo MEJORES_PRACTICAS.md - Separación de concerns
 */
import api from './axios.config';

export const permissionsApi = {
  /**
   * Obtener permisos efectivos del usuario autenticado
   */
  getPermissions: async (): Promise<string[]> => {
    const response = await api.get<string[]>('/auth/permissions');
    return response.data;
  },
};
