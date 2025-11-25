/**
 * Create Action Request DTO
 * DTO de entrada para crear una action (capa de presentación)
 * Incluye validaciones con class-validator
 */

import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsOptional,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateActionRequestDto {
  @ApiProperty({
    description:
      'Unique action key in format "module.operation" (lowercase, dot-separated)',
    example: 'users.create',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Matches(/^[a-z]+\.[a-z]+$/, {
    message:
      'Key must be in format "module.operation" (lowercase, dot-separated)',
  })
  key: string;

  @ApiProperty({
    description: 'Human-readable action name',
    example: 'Crear Usuario',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({
    description: 'Optional description of the action',
    example: 'Permite crear nuevos usuarios en el sistema',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;
}
