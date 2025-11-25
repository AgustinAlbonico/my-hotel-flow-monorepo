import { IsDateString, IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * CheckAvailabilityQueryDto
 * Patrón: DTO - Application Layer
 * Responsabilidad: Validar parámetros para verificar disponibilidad de habitaciones
 */
export class CheckAvailabilityQueryDto {
  @IsDateString(
    {},
    { message: 'Fecha de check-in debe ser una fecha válida (ISO 8601)' },
  )
  checkIn: string;

  @IsDateString(
    {},
    { message: 'Fecha de check-out debe ser una fecha válida (ISO 8601)' },
  )
  checkOut: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'roomTypeId debe ser un número entero' })
  @Min(1, { message: 'roomTypeId debe ser mayor a 0' })
  roomTypeId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'guests debe ser un número entero' })
  @Min(1, { message: 'guests debe ser mayor a 0' })
  guests?: number;
}
