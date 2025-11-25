import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsOptional,
  MinLength,
  MaxLength,
  Matches,
  IsDateString,
} from 'class-validator';

/**
 * UpdateClientRequestDto
 * Capa: Presentation
 * DTO para solicitud de actualización de cliente
 */
export class UpdateClientRequestDto {
  @ApiProperty({ example: 'Juan', description: 'Nombre del cliente' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  firstName: string;

  @ApiProperty({ example: 'Pérez', description: 'Apellido del cliente' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  lastName: string;

  @ApiProperty({
    example: 'juan.perez@email.com',
    description: 'Email del cliente',
  })
  @IsEmail()
  @MaxLength(255)
  email: string;

  @ApiProperty({
    example: '1234567890',
    description: 'Teléfono del cliente (opcional)',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(7)
  @MaxLength(15)
  @Matches(/^[0-9+\-\s()]+$/, {
    message: 'El teléfono solo puede contener números, espacios, +, -, ( y )',
  })
  phone?: string;

  @ApiProperty({
    example: '1990-05-15',
    description: 'Fecha de nacimiento (opcional)',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @ApiProperty({
    example: 'Av. Siempre Viva 742',
    description: 'Dirección (opcional)',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @ApiProperty({
    example: 'Buenos Aires',
    description: 'Ciudad (opcional)',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiProperty({
    example: 'Argentina',
    description: 'País (opcional)',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;

  @ApiProperty({
    example: 'Argentina',
    description: 'Nacionalidad (opcional)',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  nationality?: string;

  @ApiProperty({
    example: 'Cliente preferencial',
    description: 'Observaciones adicionales (opcional)',
    required: false,
  })
  @IsOptional()
  @IsString()
  observations?: string;
}
