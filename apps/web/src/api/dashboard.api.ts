/**
 * API Client - Dashboard
 * Cliente para obtener estadísticas del dashboard
 */
import api from './axios.config';

export interface StatsCard {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  color: string;
}

export interface MonthlyData {
  month: string;
  reservas: number;
  ingresos: number;
}

export interface RoomOccupancyData {
  tipo: string;
  ocupadas: number;
  disponibles: number;
}

export interface ReservationStatusData {
  name: string;
  value: number;
  color: string;
}

export interface DashboardStatsResponse {
  statsCards: StatsCard[];
  monthlyReservations: MonthlyData[];
  roomOccupancy: RoomOccupancyData[];
  reservationStatus: ReservationStatusData[];
}

/**
 * Obtener estadísticas del dashboard
 */
export const getDashboardStats = async (): Promise<DashboardStatsResponse> => {
  const response = await api.get<DashboardStatsResponse>('/dashboard/stats');
  return response.data;
};
