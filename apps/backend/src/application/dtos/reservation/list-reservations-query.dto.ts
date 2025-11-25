import {
  IsOptional,
  IsEnum,
  IsDateString,
  IsInt,
  Min,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ReservationStatus } from '../../../domain/entities/reservation.entity';

/**
 * ListReservationsQueryDto
 * Patrón: DTO - Application Layer
 * Responsabilidad: Validar parámetros de consulta para listar reservas
 */
export class ListReservationsQueryDto {
  @IsOptional()
  @IsEnum(ReservationStatus, {
    message:
      'status debe ser un estado válido: CONFIRMED, IN_PROGRESS, CANCELLED o COMPLETED',
  })
  status?: ReservationStatus;

  @IsOptional()
  @IsDateString(
    {},
    { message: 'checkInFrom debe ser una fecha válida (ISO 8601)' },
  )
  checkInFrom?: string;

  @IsOptional()
  @IsDateString(
    {},
    { message: 'checkInTo debe ser una fecha válida (ISO 8601)' },
  )
  checkInTo?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'clientId debe ser un número entero' })
  @Min(1, { message: 'clientId debe ser mayor a 0' })
  clientId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'roomId debe ser un número entero' })
  @Min(1, { message: 'roomId debe ser mayor a 0' })
  roomId?: number;

  @IsOptional()
  @IsString({ message: 'search debe ser una cadena de texto' })
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'page debe ser un número entero' })
  @Min(1, { message: 'page debe ser mayor a 0' })
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit debe ser un número entero' })
  @Min(1, { message: 'limit debe ser mayor a 0' })
  limit?: number = 20;
}
