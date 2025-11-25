import axios from './axios.config';

/**
 * Interfaces para tipos de datos de clientes
 */
export interface CreateClientRequest {
  dni: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  birthDate?: string;
  address?: string;
  city?: string;
  country?: string;
  nationality?: string;
  observations?: string;
  actionGroups?: string[]; // Grupo de acciones para el cliente
}

export interface ClientCreatedResponse {
  id: number;
  dni: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  temporaryPassword: string;
}

export interface ClientListItem {
  id: string;
  dni: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ClientDetail {
  id: number;
  dni: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  birthDate: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  nationality: string | null;
  observations: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateClientRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  birthDate?: string;
  address?: string;
  city?: string;
  country?: string;
  nationality?: string;
  observations?: string;
}

export interface CheckDniResponse {
  exists: boolean;
  message: string;
}

/**
 * API Client para endpoints de clientes
 */

/**
 * Verifica si un DNI está disponible
 * @param dni - DNI a verificar
 * @returns Resultado de verificación
 */
export const checkDniAvailability = async (
  dni: string,
): Promise<CheckDniResponse> => {
  const response = await axios.get<CheckDniResponse>(`/clients/check-dni/${dni}`);
  // El interceptor ya extrae 'data' de la respuesta estándar
  return response.data;
};

/**
 * Crea un nuevo cliente
 * @param data - Datos del cliente
 * @returns Cliente creado con contraseña temporal
 */
export const createClient = async (
  data: CreateClientRequest,
): Promise<ClientCreatedResponse> => {
  const response = await axios.post<ClientCreatedResponse>('/clients', data);
  // El interceptor ya extrae 'data' de la respuesta estándar
  return response.data;
};

/**
 * Obtiene la lista de todos los clientes
 * @returns Lista de clientes
 */
export const listClients = async (): Promise<ClientListItem[]> => {
  const response = await axios.get<ClientListItem[]>('/clients');
  // El interceptor ya extrae 'data' de la respuesta estándar
  return response.data;
};

/**
 * Obtiene los detalles completos de un cliente por ID
 * @param id - ID del cliente
 * @returns Detalles del cliente
 */
export const getClientById = async (id: string): Promise<ClientDetail> => {
  const response = await axios.get<ClientDetail>(`/clients/${id}`);
  // El interceptor ya extrae 'data' de la respuesta estándar
  return response.data;
};

/**
 * Actualiza los datos de un cliente
 * @param id - ID del cliente
 * @param data - Datos actualizados
 * @returns Cliente actualizado
 */
export const updateClient = async (
  id: string,
  data: UpdateClientRequest,
): Promise<ClientDetail> => {
  const response = await axios.put<ClientDetail>(`/clients/${id}`, data);
  // El interceptor ya extrae 'data' de la respuesta estándar
  return response.data;
};

/**
 * Elimina (da de baja) un cliente
 * @param id - ID del cliente
 */
export const deleteClient = async (id: string): Promise<void> => {
  await axios.delete(`/clients/${id}`);
};
