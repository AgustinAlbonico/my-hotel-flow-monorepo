import { IsString, MaxLength, IsNotEmpty } from 'class-validator';

/**
 * CancelReservationDto
 * Patrón: DTO - Application Layer
 * Responsabilidad: Validar input para cancelación de reserva
 */
export class CancelReservationDto {
  @IsNotEmpty({ message: 'El motivo de cancelación es obligatorio' })
  @IsString({ message: 'El motivo debe ser un texto' })
  @MaxLength(100, { message: 'El motivo no puede exceder los 100 caracteres' })
  reason: string;
}
