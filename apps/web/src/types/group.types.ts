/**
 * Types de Grupos
 * Siguiendo MEJORES_PRACTICAS.md - Type safety
 */

import { Action } from './user.types';

export interface Group {
  id: number;
  key: string;
  name: string;
  description?: string;
  actions?: Action[];
  children?: Group[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateGroupPayload {
  key: string;
  name: string;
  description?: string;
}

export interface UpdateGroupPayload {
  name?: string;
  description?: string;
}

export interface SetGroupActionsPayload {
  actionKeys: string[];
}

export interface SetGroupChildrenPayload {
  childrenIds: number[];
}
