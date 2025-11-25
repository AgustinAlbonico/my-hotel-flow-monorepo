import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { RoomCondition } from '../../../domain/value-objects/check-out-record.value-object';

/**
 * CheckOutDto
 * Patrón: DTO - Application Layer
 * Responsabilidad: Validar input para realizar check-out
 */
export class CheckOutDto {
  @IsEnum(RoomCondition, {
    message:
      'roomCondition debe ser un valor válido: GOOD, REGULAR o NEEDS_DEEP_CLEANING',
  })
  roomCondition: RoomCondition;

  @IsOptional()
  @IsString({ message: 'Las observaciones deben ser texto' })
  @MaxLength(500, {
    message: 'Las observaciones no pueden exceder los 500 caracteres',
  })
  observations?: string;
}
