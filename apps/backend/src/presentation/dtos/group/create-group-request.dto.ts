/**
 * Create Group Request DTO
 * DTO de presentación con validaciones para crear un grupo
 */

import { IsString, IsNotEmpty, MaxLength, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateGroupRequestDto {
  @ApiProperty({
    description: 'Unique key for the group',
    example: 'rol.admin',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  key: string;

  @ApiProperty({
    description: 'Group name',
    example: 'Administrador',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({
    description: 'Group description',
    example: 'Grupo con todos los permisos del sistema',
  })
  @IsString()
  @IsOptional()
  description?: string;
}
