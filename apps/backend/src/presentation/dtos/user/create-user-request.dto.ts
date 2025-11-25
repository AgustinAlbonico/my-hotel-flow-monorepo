/**
 * Create User Request DTO
 * DTO de presentación con validaciones para crear un usuario
 */

import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsOptional,
  IsEmail,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserRequestDto {
  @ApiProperty({
    description: 'Username',
    example: 'john.doe',
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  username: string;

  @ApiProperty({
    description: 'Email address',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Password',
    example: 'SecurePass123!',
    minLength: 8,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @ApiPropertyOptional({
    description: 'Full name',
    example: 'John Doe',
    maxLength: 255,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  fullName?: string;
}
