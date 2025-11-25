/**
 * Types de Acciones (Permisos)
 * Siguiendo MEJORES_PRACTICAS.md - Type safety
 */

export interface Action {
  id: number;
  key: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateActionPayload {
  key: string;
  name: string;
  description?: string;
}

export interface UpdateActionPayload {
  key?: string;
  name?: string;
  description?: string;
}
