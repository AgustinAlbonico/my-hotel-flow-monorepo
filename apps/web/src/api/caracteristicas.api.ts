import axios from './axios.config';

/**
 * Interfaces para tipos de datos de características
 */
export interface CreateCaracteristicaRequest {
  nombre: string;
  descripcion?: string;
}

export interface UpdateCaracteristicaRequest {
  nombre?: string;
  descripcion?: string;
  isActive?: boolean;
}

export interface Caracteristica {
  id: number;
  nombre: string;
  descripcion: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * API Client para endpoints de características
 */

/**
 * Crea una nueva característica
 * @param data - Datos de la característica
 * @returns Característica creada
 */
export const createCaracteristica = async (
  data: CreateCaracteristicaRequest
): Promise<Caracteristica> => {
  const response = await axios.post<Caracteristica>('/caracteristicas', data);
  return response.data;
};

/**
 * Obtiene la lista de características
 * @param onlyActive - Si true, solo devuelve características activas
 * @returns Lista de características
 */
export const listCaracteristicas = async (
  onlyActive: boolean = true
): Promise<Caracteristica[]> => {
  const url = `/caracteristicas?onlyActive=${onlyActive}`;
  const response = await axios.get<Caracteristica[]>(url);
  return response.data;
};

/**
 * Actualiza una característica existente
 * @param id - ID de la característica
 * @param data - Datos a actualizar
 * @returns Característica actualizada
 */
export const updateCaracteristica = async (
  id: number,
  data: UpdateCaracteristicaRequest
): Promise<Caracteristica> => {
  const response = await axios.put<Caracteristica>(
    `/caracteristicas/${id}`,
    data
  );
  return response.data;
};

/**
 * Elimina una característica (soft delete)
 * @param id - ID de la característica
 */
export const deleteCaracteristica = async (id: number): Promise<void> => {
  await axios.delete(`/caracteristicas/${id}`);
};
