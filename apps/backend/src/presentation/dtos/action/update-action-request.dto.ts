/**
 * Update Action Request DTO
 * DTO de entrada para actualizar una action (capa de presentación)
 * Incluye validaciones con class-validator
 */

import { IsString, MaxLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateActionRequestDto {
  @ApiProperty({
    description: 'Human-readable action name',
    example: 'Crear Usuario',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  name?: string;

  @ApiProperty({
    description: 'Optional description of the action',
    example: 'Permite crear nuevos usuarios en el sistema',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;
}
