/**
 * Daily Occupancy DTOs
 * Representan el resumen de ocupación diaria por tipo de habitación.
 */
export class DailyOccupancySummaryDto {
  roomType!: string;
  total!: number;
  occupied!: number;
  reserved!: number;
  available!: number;
  occupancyPercentage!: number;
}

export class DailyOccupancyResponseDto {
  date!: string;
  summary!: DailyOccupancySummaryDto[];
}
