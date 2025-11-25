import { IsDateString, IsOptional } from 'class-validator';

/**
 * UpdateReservationDto
 * Patrón: DTO - Application Layer
 * Responsabilidad: Validar input para modificación de fechas de reserva
 */
export class UpdateReservationDto {
  @IsOptional()
  @IsDateString(
    {},
    { message: 'Fecha de check-in debe ser una fecha válida (ISO 8601)' },
  )
  checkIn?: string;

  @IsOptional()
  @IsDateString(
    {},
    { message: 'Fecha de check-out debe ser una fecha válida (ISO 8601)' },
  )
  checkOut?: string;
}
