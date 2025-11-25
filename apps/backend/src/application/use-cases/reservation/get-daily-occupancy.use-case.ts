/**
 * GetDailyOccupancyUseCase
 * Patrón: Use Case - Clean Architecture
 * Capa: Application
 * Responsabilidad: Obtener resumen de ocupación diaria por tipo de habitación.
 */
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  DailyOccupancyResponseDto,
  DailyOccupancySummaryDto,
} from '../../dtos/reservation/daily-occupancy.dto';

@Injectable()
export class GetDailyOccupancyUseCase {
  constructor(private readonly dataSource: DataSource) {}

  async execute(dateIso: string): Promise<DailyOccupancyResponseDto> {
    const targetDate = new Date(dateIso);

    // Consulta agregada por tipo de habitación.
    // Se considera:
    // - occupied: reservas en estado IN_PROGRESS para la fecha indicada.
    // - reserved: reservas en estado CONFIRMED para la fecha indicada (sin estar IN_PROGRESS).
    const rows = await this.dataSource.query(
      `
      SELECT
        rt.code AS "roomType",
        COUNT(r.id) AS "total",
        SUM(
          CASE
            WHEN EXISTS (
              SELECT 1 FROM reservations res
              WHERE res."roomId" = r.id
                AND res.status = 'IN_PROGRESS'
                AND res."checkIn" <= $1
                AND res."checkOut" > $1
            ) THEN 1 ELSE 0
          END
        ) AS "occupied",
        SUM(
          CASE
            WHEN NOT EXISTS (
              SELECT 1 FROM reservations res
              WHERE res."roomId" = r.id
                AND res.status = 'IN_PROGRESS'
                AND res."checkIn" <= $1
                AND res."checkOut" > $1
            )
            AND EXISTS (
              SELECT 1 FROM reservations res
              WHERE res."roomId" = r.id
                AND res.status = 'CONFIRMED'
                AND res."checkIn" <= $1
                AND res."checkOut" > $1
            )
            THEN 1 ELSE 0
          END
        ) AS "reserved"
      FROM rooms r
      JOIN room_types rt ON rt.id = r."roomTypeId"
      WHERE r."isActive" = true
      GROUP BY rt.code
      ORDER BY rt.code
      `,
      [targetDate],
    );

    const summary: DailyOccupancySummaryDto[] = rows.map(
      (row: {
        roomType: string;
        total: string | number;
        occupied: string | number;
        reserved: string | number;
      }) => {
        const total = Number(row.total) || 0;
        const occupied = Number(row.occupied) || 0;
        const reserved = Number(row.reserved) || 0;
        const available = Math.max(total - occupied - reserved, 0);
        const occupancyPercentage =
          total > 0 ? Math.round((occupied / total) * 100) : 0;

        const item = new DailyOccupancySummaryDto();
        item.roomType = row.roomType;
        item.total = total;
        item.occupied = occupied;
        item.reserved = reserved;
        item.available = available;
        item.occupancyPercentage = occupancyPercentage;
        return item;
      },
    );

    const response = new DailyOccupancyResponseDto();
    response.date = dateIso;
    response.summary = summary;
    return response;
  }
}
