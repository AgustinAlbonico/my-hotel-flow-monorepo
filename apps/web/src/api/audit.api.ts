/**
 * API Client - Audit
 * Servicio para consumir endpoints de auditoría
 */
import api from './axios.config';

// ==================== Tipos ====================

export interface ReservationAuditLog {
  id: string;
  reservationId: number;
  actionType: string;
  fieldChanged: string | null;
  oldValue: string | null;
  newValue: string | null;
  changeReason: string | null;
  changedByUserId: number;
  changedByUsername: string;
  changedBySystem: string;
  ipAddress: string | null;
  changedAt: string;
  metadata: Record<string, any> | null;
}

export interface UserSession {
  id: string;
  userId: number;
  username: string;
  loginAt: string;
  loginIp: string | null;
  logoutAt: string | null;
  logoutType: string | null;
  isActive: boolean;
  duration: number | null;
}

export interface UserActivity {
  id: string;
  userId: number;
  activityType: string;
  activityDescription: string | null;
  endpoint: string | null;
  httpMethod: string | null;
  responseStatus: number | null;
  responseTimeMs: number | null;
  activityAt: string;
}

export interface PaginationMetadata {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AuditResponse<T> {
  success: boolean;
  data: T[];
  pagination: PaginationMetadata;
}

export interface AuditSummary {
  period: {
    startDate: string;
    endDate: string;
  };
  reservationChanges: {
    total: number;
    byAction: Record<string, number>;
  };
  sessions: {
    total: number;
    active: number;
  };
  activity: {
    total: number;
  };
  topUsers: Array<{
    userId: number;
    actions: number;
  }>;
}

// ==================== Filtros ====================

export interface ReservationAuditFilters {
  reservationId?: number;
  startDate?: string;
  endDate?: string;
  userId?: number;
  actionType?: string;
  system?: string;
  page?: number;
  limit?: number;
}

export interface UserSessionFilters {
  userId?: number;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface UserActivityFilters {
  userId?: number;
  sessionId?: string;
  activityType?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

// ==================== API Methods ====================

/**
 * Obtener historial de cambios en reservas
 */
export const getReservationChanges = async (
  filters: ReservationAuditFilters = {},
): Promise<AuditResponse<ReservationAuditLog>> => {
  const response = await api.get('/audit/reservations/changes', {
    params: filters,
  });
  return response.data;
};

/**
 * Obtener historial completo de una reserva específica
 */
export const getReservationHistory = async (
  reservationId: number,
): Promise<{ success: boolean; data: ReservationAuditLog[] }> => {
  const response = await api.get(`/audit/reservations/${reservationId}/history`);
  return response.data;
};

/**
 * Obtener historial de sesiones de usuarios
 */
export const getUserSessions = async (
  filters: UserSessionFilters = {},
): Promise<AuditResponse<UserSession>> => {
  const response = await api.get('/audit/sessions', {
    params: filters,
  });
  return response.data;
};

/**
 * Obtener actividad de usuarios
 */
export const getUserActivity = async (
  filters: UserActivityFilters = {},
): Promise<AuditResponse<UserActivity>> => {
  const response = await api.get('/audit/activity', {
    params: filters,
  });
  return response.data;
};

/**
 * Obtener resumen de auditoría (últimos 7 días)
 */
export const getAuditSummary = async (): Promise<{
  success: boolean;
  data: AuditSummary;
}> => {
  const response = await api.get('/audit/summary');
  return response.data;
};
