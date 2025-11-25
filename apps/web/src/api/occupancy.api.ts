/**
 * API Client - Occupancy
 * Cliente mínimo para el endpoint de ocupación diaria.
 */
import api from './axios.config';

export interface DailyOccupancySummary {
  roomType: string;
  total: number;
  occupied: number;
  reserved: number;
  available: number;
  occupancyPercentage: number;
}

export interface DailyOccupancyResponse {
  date: string;
  summary: DailyOccupancySummary[];
}

export const getDailyOccupancy = async (
  date?: string,
): Promise<DailyOccupancyResponse> => {
  const response = await api.get<DailyOccupancyResponse>('/occupancy/daily', {
    params: { date },
  });
  return response.data;
};


