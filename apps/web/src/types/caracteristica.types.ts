/**
 * Tipos relacionados con Características
 */

export interface Caracteristica {
  id: number;
  nombre: string;
  descripcion: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCaracteristicaRequest {
  nombre: string;
  descripcion?: string;
}

export interface UpdateCaracteristicaRequest {
  nombre?: string;
  descripcion?: string;
  isActive?: boolean;
}
