import axios from './axios.config';

/**
 * Interfaces para tipos de datos de habitaciones
 */
export interface CreateRoomRequest {
  numeroHabitacion: string;
  roomTypeId: number;
  descripcion?: string;
  caracteristicasAdicionales?: string[];
}

export interface UpdateRoomRequest {
  descripcion?: string;
  caracteristicasAdicionales?: string[];
}

export interface ChangeRoomStatusRequest {
  status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'OUT_OF_SERVICE';
}

export interface Room {
  id: number;
  numeroHabitacion: string;
  tipo: string; // Código del tipo (string único)
  tipoNombre: string; // Nombre descriptivo del tipo
  estado: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'OUT_OF_SERVICE';
  capacidad: number; // Viene del RoomType
  precioPorNoche: number; // Viene del RoomType
  descripcion: string | null;
  caracteristicas: string[]; // Incluye las del tipo + adicionales
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ListRoomsFilters {
  tipo?: 'ESTANDAR' | 'SUITE' | 'FAMILIAR';
  estado?: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'OUT_OF_SERVICE';
  capacidadMinima?: number;
  precioMaximo?: number;
  onlyActive?: boolean;
}

/**
 * API Client para endpoints de habitaciones
 */

/**
 * Crea una nueva habitación
 * @param data - Datos de la habitación
 * @returns Habitación creada
 */
export const createRoom = async (data: CreateRoomRequest): Promise<Room> => {
  const response = await axios.post<Room>('/rooms', data);
  return response.data;
};

/**
 * Obtiene la lista de habitaciones con filtros opcionales
 * @param filters - Filtros opcionales
 * @returns Lista de habitaciones
 */
export const listRooms = async (filters?: ListRoomsFilters): Promise<Room[]> => {
  const params = new URLSearchParams();
  
  if (filters) {
    if (filters.tipo) params.append('tipo', filters.tipo);
    if (filters.estado) params.append('estado', filters.estado);
    if (filters.capacidadMinima) params.append('capacidadMinima', filters.capacidadMinima.toString());
    if (filters.precioMaximo) params.append('precioMaximo', filters.precioMaximo.toString());
    if (filters.onlyActive !== undefined) params.append('onlyActive', filters.onlyActive.toString());
  }

  const queryString = params.toString();
  const url = queryString ? `/rooms?${queryString}` : '/rooms';
  
  const response = await axios.get<Room[]>(url);
  return response.data;
};

/**
 * Obtiene los detalles de una habitación por ID
 * @param id - ID de la habitación
 * @returns Detalles de la habitación
 */
export const getRoomById = async (id: number): Promise<Room> => {
  const response = await axios.get<Room>(`/rooms/${id}`);
  return response.data;
};

/**
 * Actualiza los datos de una habitación
 * @param id - ID de la habitación
 * @param data - Datos actualizados
 * @returns Habitación actualizada
 */
export const updateRoom = async (
  id: number,
  data: UpdateRoomRequest,
): Promise<Room> => {
  const response = await axios.put<Room>(`/rooms/${id}`, data);
  return response.data;
};

/**
 * Cambia el estado de una habitación
 * @param id - ID de la habitación
 * @param data - Nuevo estado
 * @returns Habitación actualizada
 */
export const changeRoomStatus = async (
  id: number,
  data: ChangeRoomStatusRequest,
): Promise<Room> => {
  const response = await axios.patch<Room>(`/rooms/${id}/status`, data);
  return response.data;
};

/**
 * Elimina (desactiva) una habitación
 * @param id - ID de la habitación
 */
export const deleteRoom = async (id: number): Promise<void> => {
  await axios.delete(`/rooms/${id}`);
};
