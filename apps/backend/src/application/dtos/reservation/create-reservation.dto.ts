import {
  IsInt,
  Min,
  IsDateString,
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

/**
 * CreateReservationDto
 * Patrón: DTO - Application Layer
 * Responsabilidad: Validar input para creación de reserva
 */
export class CreateReservationDto {
  @IsInt({ message: 'ID de cliente debe ser un número entero' })
  @Min(1, { message: 'ID de cliente debe ser mayor a 0' })
  clientId: number;

  @IsInt({ message: 'ID de habitación debe ser un número entero' })
  @Min(1, { message: 'ID de habitación debe ser mayor a 0' })
  roomId: number;

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
  @IsBoolean({
    message: 'notifyByEmail debe ser un valor booleano',
  })
  notifyByEmail?: boolean;

  @IsOptional()
  @IsBoolean({
    message: 'notifyBySMS debe ser un valor booleano',
  })
  notifyBySMS?: boolean;

  @IsOptional()
  @IsString({ message: 'idempotencyKey debe ser un texto' })
  @MaxLength(255, {
    message: 'idempotencyKey no puede exceder los 255 caracteres',
  })
  idempotencyKey?: string;
}
