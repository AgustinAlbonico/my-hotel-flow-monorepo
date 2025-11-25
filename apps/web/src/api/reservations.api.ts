/**
 * API Client - Reservations
 * Siguiendo MEJORES_PRACTICAS.md - Módulo de API
 */
import api from './axios.config';

export interface ReservationMenuOption {
  key: string;
  label: string;
  description: string;
  icon: string;
  path: string;
  requiredAction: string;
  isAvailable: boolean;
}

export interface ReservationMenuResponse {
  options: ReservationMenuOption[];
  totalOptions: number;
  availableOptions: number;
}

// Tipos para listados de reservas
export type ReservationStatusApi =
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'CANCELLED'
  | 'COMPLETED';

export interface ReservationClientSummary {
  id: number;
  dni: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
}

export interface ReservationRoomSummary {
  id: number;
  numeroHabitacion: string;
  roomTypeCode?: string;
  roomTypeName?: string;
  estado: string;
  pricePerNight?: number;
}

export interface ReservationListItem {
  id: number;
  code: string;
  clientId: number;
  roomId: number | null;
  status: ReservationStatusApi;
  checkIn: string;
  checkOut: string;
  createdAt: string;
  updatedAt: string;
  totalNights: number;
  totalPrice?: number;
  client?: ReservationClientSummary | null;
  room?: ReservationRoomSummary | null;
}

export interface ReservationListPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ReservationListResponse {
  data: ReservationListItem[];
  pagination?: ReservationListPagination;
}

export interface DebtInvoice {
  id: number;
  invoiceNumber: string;
  total: number;
  amountPaid: number;
  outstandingBalance: number;
  status: string;
  isOverdue: boolean;
  reservationId?: number;
  checkIn?: string;
  checkOut?: string;
  roomNumber?: string;
  roomType?: string;
  description?: string;
}

export interface ClientFound {
  id: number;
  dni: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string | null;
  outstandingBalance?: number;
  isDebtor?: boolean;
  invoices?: DebtInvoice[];
}

export interface AvailableRoom {
  id: number;
  numeroHabitacion: string;
  tipo: string;
  capacidad: number;
  precioPorNoche: number;
  descripcion: string | null;
  caracteristicas: string[];
  precioTotal: number;
  cantidadNoches: number;
}

export interface ReservationCreated {
  id: number;
  code: string;
  clientId: number;
  roomId: number;
  checkIn: Date;
  checkOut: Date;
  status: string;
  cantidadNoches: number;
  precioTotal: number;
  createdAt: Date;
}

/**
 * Obtener menú de gestión de reservas
 * Solo retorna opciones disponibles según permisos del usuario
 */
export const getReservationMenu = async (): Promise<ReservationMenuResponse> => {
  const response = await api.get<ReservationMenuResponse>('/reservations/menu');
  return response.data;
};

/**
 * Buscar cliente por DNI
 */
type WrappedClient = { success: boolean; data: ClientFound | null };
const hasProp = <T extends string>(obj: unknown, prop: T): obj is Record<T, unknown> => {
  return typeof obj === 'object' && obj !== null && prop in obj;
};
const isWrappedClient = (x: unknown): x is WrappedClient => {
  return hasProp(x, 'success') && hasProp(x, 'data');
};

export const searchClientByDNI = async (dni: string): Promise<ClientFound | null> => {
  // Importante: todas las llamadas deben pasar por nuestra instancia `api` que desenvuelve { success, data }
  // El interceptor de axios (axios.config.ts) ya retorna directamente `data`.
  // Si por algún motivo llega la respuesta envuelta, hacemos un fallback defensivo.
  const response = await api.post<ClientFound | WrappedClient>(
    '/reservations/search-client',
    { dni },
  );

  const payload = response.data as ClientFound | WrappedClient;

  // Fallback: si viene envuelto, devolver el inner data
  let client: ClientFound | null;
  if (isWrappedClient(payload)) {
    client = payload.data ?? null;
  } else {
    client = payload as ClientFound | null;
  }
  if (!client) return null;
  client.outstandingBalance = client.outstandingBalance ?? 0;
  client.isDebtor = client.isDebtor ?? (client.outstandingBalance > 0);
  // Normalizar campos de facturas si existen
  if (client.invoices) {
    client.invoices = client.invoices.map((inv) => ({
      ...inv,
      description: inv.description || (inv.checkIn && inv.checkOut
        ? `Estadía del ${inv.checkIn.substring(0,10)} al ${inv.checkOut.substring(0,10)}${inv.roomNumber ? ` (${inv.roomNumber}${inv.roomType ? ` · ${inv.roomType}` : ''})` : ''}`
        : undefined),
    }));
  }
  return client;
};

/**
 * Buscar habitaciones disponibles
 */
export const getAvailableRooms = async (params: {
  checkInDate: string;
  checkOutDate: string;
  roomType: string;
  capacity?: number;
}): Promise<AvailableRoom[]> => {
  // Solo enviar capacity si está definido y es un número válido
  const queryParams: Record<string, string | number> = {
    checkInDate: params.checkInDate,
    checkOutDate: params.checkOutDate,
    roomType: params.roomType,
  };
  
  if (params.capacity && !isNaN(params.capacity) && params.capacity > 0) {
    queryParams.capacity = params.capacity;
  }
  
  const response = await api.get<AvailableRoom[]>('/reservations/available-rooms', { params: queryParams });
  return response.data;
};

/**
 * Crear nueva reserva
 */
export const createReservation = async (data: {
  clientId: number;
  roomId: number;
  checkIn: string;
  checkOut: string;
  notifyByEmail?: boolean;
  notifyBySMS?: boolean;
}): Promise<ReservationCreated> => {
  const response = await api.post<ReservationCreated>('/reservations', data);
  return response.data;
};

/**
 * Realizar check-in de una reserva
 */
export const performCheckIn = async (
  reservationId: number,
  data?: { documentsVerified?: boolean; observations?: string },
): Promise<{ success: boolean; message: string }> => {
  const response = await api.post<{ success: boolean; message: string }>(
    `/reservations/${reservationId}/check-in`,
    data ?? {},
  );
  return response.data;
};

/**
 * Realizar check-out de una reserva
 */
export type RoomConditionApi = 'GOOD' | 'REGULAR' | 'NEEDS_DEEP_CLEANING';

export const performCheckOut = async (
  reservationId: number,
  data: {
    roomCondition: RoomConditionApi;
    observations?: string;
  }
): Promise<{ success: boolean; message: string }> => {
  const response = await api.post<{ success: boolean; message: string }>(
    `/reservations/${reservationId}/check-out`,
    data
  );
  return response.data;
};

/**
 * Listar reservas activas (IN_PROGRESS)
 */
export const getActiveReservations = async (): Promise<ReservationListItem[]> => {
  const response = await api.get('/reservations', {
    params: { status: 'IN_PROGRESS' },
  });
  return normalizeReservationListResponse(response.data).data;
};

/**
 * Listar reservas confirmadas (CONFIRMED - pendientes de check-in)
 */
export const getConfirmedReservations = async (): Promise<ReservationListItem[]> => {
  const response = await api.get('/reservations', {
    params: { status: 'CONFIRMED' },
  });
  return normalizeReservationListResponse(response.data).data;
};

export const searchReservationsByDate = async (params: {
  startDate?: string;
  endDate?: string;
  status?: string;
}): Promise<{
  data: ReservationListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> => {
  const response = await api.get('/reservations', {
    params: {
      checkInFrom: params.startDate,
      checkInTo: params.endDate,
      status: params.status,
    },
  });
  const normalized = normalizeReservationListResponse(response.data);
  return {
    data: normalized.data,
    total: normalized.pagination?.total ?? normalized.data.length,
    page: normalized.pagination?.page ?? 1,
    limit:
      normalized.pagination?.limit ?? (normalized.data.length || 1),
    totalPages: normalized.pagination?.totalPages ?? 1,
  };
};

/**
 * Buscar reservas confirmadas por diferentes criterios
 */
export const searchConfirmedReservations = async (searchTerm: string): Promise<ReservationListItem[]> => {
  const response = await api.get('/reservations', {
    params: { 
      status: 'CONFIRMED',
      search: searchTerm 
    },
  });
  return normalizeReservationListResponse(response.data).data;
};

export const getReservationsByClient = async (
  clientId: number,
  filters?: {
    status?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  },
): Promise<ReservationListResponse> => {
  const response = await api.get('/reservations', {
    params: {
      clientId,
      status: filters?.status,
      checkInFrom: filters?.from,
      checkInTo: filters?.to,
      page: filters?.page,
      limit: filters?.limit,
    },
  });

  return normalizeReservationListResponse(response.data);
};

const normalizeReservationListResponse = (payload: unknown): ReservationListResponse => {
  if (
    typeof payload === 'object' &&
    payload !== null &&
    'data' in payload &&
    Array.isArray((payload as { data: ReservationListItem[] }).data)
  ) {
    const typed = payload as {
      data: ReservationListItem[];
      pagination?: ReservationListPagination;
    };

    return {
      data: typed.data,
      pagination: typed.pagination,
    };
  }

  return {
    data: (payload as ReservationListItem[]) || [],
  };
};

export const reservationsApi = {
  getReservationMenu,
  searchClientByDNI,
  getAvailableRooms,
  createReservation,
  performCheckIn,
  performCheckOut,
  getActiveReservations,
  getConfirmedReservations,
  searchReservationsByDate,
  searchConfirmedReservations,
  getReservationsByClient,
};
