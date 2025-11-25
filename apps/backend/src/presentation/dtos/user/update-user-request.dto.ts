/**
 * Update User Request DTO
 * DTO de presentación con validaciones para actualizar un usuario
 */

import {
  IsString,
  IsOptional,
  MaxLength,
  IsEmail,
  IsBoolean,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserRequestDto {
  @ApiPropertyOptional({
    description: 'Username',
    example: 'john.doe',
    maxLength: 50,
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  username?: string;

  @ApiPropertyOptional({
    description: 'Email address',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    description: 'Full name',
    example: 'John Doe',
    maxLength: 255,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  fullName?: string;

  @ApiPropertyOptional({
    description: 'Active status',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
