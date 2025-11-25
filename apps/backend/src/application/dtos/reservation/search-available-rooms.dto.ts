import { IsDateString, IsEnum, IsOptional, IsInt, Min } from 'class-validator';

/**
 * SearchAvailableRoomsDto
 * Patrón: DTO - Application Layer
 * Responsabilidad: Validar input para búsqueda de habitaciones disponibles
 */
export class SearchAvailableRoomsDto {
  @IsDateString(
    {},
    { message: 'Fecha de check-in debe ser una fecha válida (ISO 8601)' },
  )
  checkInDate: string;

  @IsDateString(
    {},
    { message: 'Fecha de check-out debe ser una fecha válida (ISO 8601)' },
  )
  checkOutDate: string;

  @IsEnum(['ESTANDAR', 'SUITE', 'FAMILIAR'], {
    message: 'Tipo de habitación debe ser ESTANDAR, SUITE o FAMILIAR',
  })
  roomType: string;

  @IsOptional()
  @IsInt({ message: 'Capacidad debe ser un número entero' })
  @Min(1, { message: 'Capacidad debe ser al menos 1' })
  capacity?: number;
}
