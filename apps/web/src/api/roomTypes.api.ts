import axios from './axios.config';

/**
 * Interfaces para tipos de datos de tipos de habitación
 */
export interface CreateRoomTypeRequest {
  code: string; // Código único (ej: "estandar", "suite-deluxe")
  name: string;
  precioPorNoche: number;
  capacidadMaxima: number;
  descripcion?: string;
  caracteristicasIds?: number[];
}

export interface UpdateRoomTypeRequest {
  name?: string;
  precioPorNoche?: number;
  capacidadMaxima?: number;
  descripcion?: string;
  caracteristicasIds?: number[];
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

export interface RoomTypeResponse {
  id: number;
  code: string; // Código único
  name: string;
  precioPorNoche: number;
  capacidadMaxima: number;
  descripcion: string | null;
  caracteristicas: Caracteristica[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Interfaces para respuestas de la API
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  meta: {
    timestamp: string;
    requestId?: string;
  };
}

/**
 * API de tipos de habitación
 */
export const roomTypesApi = {
  /**
   * Obtener todos los tipos de habitación
   */
  async getRoomTypes(
    onlyActive?: boolean,
  ): Promise<ApiResponse<RoomTypeResponse[]>> {
    const params: Record<string, string> = {};
    if (onlyActive === true) {
      params.onlyActive = 'true';
    } else if (onlyActive === false) {
      params.onlyActive = 'false';
    }
    // Si onlyActive es undefined, no envía el parámetro (backend lo toma como false por defecto)
    
    const response = await axios.get<ApiResponse<RoomTypeResponse[]>>(
      '/room-types',
      Object.keys(params).length > 0 ? { params } : undefined,
    );
    return response.data;
  },

  /**
   * Obtener un tipo de habitación por ID
   */
  async getRoomTypeById(id: number): Promise<ApiResponse<RoomTypeResponse>> {
    const response = await axios.get<ApiResponse<RoomTypeResponse>>(
      `/room-types/${id}`,
    );
    return response.data;
  },

  /**
   * Crear un nuevo tipo de habitación
   */
  async createRoomType(
    data: CreateRoomTypeRequest,
  ): Promise<ApiResponse<RoomTypeResponse>> {
    const response = await axios.post<ApiResponse<RoomTypeResponse>>(
      '/room-types',
      data,
    );
    return response.data;
  },

  /**
   * Actualizar un tipo de habitación existente
   */
  async updateRoomType(
    id: number,
    data: UpdateRoomTypeRequest,
  ): Promise<ApiResponse<RoomTypeResponse>> {
    const response = await axios.put<ApiResponse<RoomTypeResponse>>(
      `/room-types/${id}`,
      data,
    );
    return response.data;
  },

  /**
   * Eliminar un tipo de habitación (borrado lógico)
   */
  async deleteRoomType(id: number): Promise<void> {
    await axios.delete(`/room-types/${id}`);
  },
};
