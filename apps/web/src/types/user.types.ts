/**
 * Types de Usuarios
 * Siguiendo MEJORES_PRACTICAS.md - Type safety
 */

// Importar tipos de grupo y acción
export interface Group {
  id: number;
  key: string;
  name: string;
  description?: string;
}

export interface Action {
  id: number;
  key: string;
  name: string;
  description?: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  fullName?: string;
  isActive: boolean;
  lastLoginAt?: string;
  groups?: Group[];
  actions?: Action[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserPayload {
  username: string;
  email: string;
  password?: string;
  fullName?: string;
}

export interface UpdateUserPayload {
  username?: string;
  email?: string;
  fullName?: string;
  isActive?: boolean;
}

export interface SetUserGroupsPayload {
  groupIds: number[];
}

export interface SetUserActionsPayload {
  actionKeys: string[];
}

export interface ResetPasswordPayload {
  newPassword: string;
}
