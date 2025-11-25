/**
 * Update Group Request DTO
 * DTO de presentación con validaciones para actualizar un grupo
 */

import { IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateGroupRequestDto {
  @ApiPropertyOptional({
    description: 'Group name',
    example: 'Administrador',
    maxLength: 255,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({
    description: 'Group description',
    example: 'Grupo con todos los permisos del sistema',
  })
  @IsString()
  @IsOptional()
  description?: string;
}
