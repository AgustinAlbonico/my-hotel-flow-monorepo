import {
  IsString,
  IsEmail,
  IsOptional,
  Matches,
  MinLength,
  MaxLength,
  IsNotEmpty,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO de Request para crear un cliente
 * Capa: Presentation
 * Validaciones con class-validator para la API REST
 */
export class CreateClientRequestDto {
  @ApiProperty({
    example: '12345678',
    description: 'DNI del cliente (7-8 dígitos numéricos)',
  })
  @IsNotEmpty({ message: 'El DNI es obligatorio' })
  @IsString()
  @Matches(/^[0-9]{7,8}$/, {
    message: 'El DNI debe tener entre 7 y 8 dígitos numéricos',
  })
  dni: string;

  @ApiProperty({ example: 'Juan', description: 'Nombre del cliente' })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @IsString()
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  @MaxLength(100, { message: 'El nombre no puede exceder 100 caracteres' })
  firstName: string;

  @ApiProperty({ example: 'Pérez', description: 'Apellido del cliente' })
  @IsNotEmpty({ message: 'El apellido es obligatorio' })
  @IsString()
  @MinLength(2, { message: 'El apellido debe tener al menos 2 caracteres' })
  @MaxLength(100, { message: 'El apellido no puede exceder 100 caracteres' })
  lastName: string;

  @ApiProperty({
    example: 'juan.perez@example.com',
    description: 'Email del cliente',
  })
  @IsNotEmpty({ message: 'El email es obligatorio' })
  @IsEmail({}, { message: 'El email debe tener un formato válido' })
  email: string;

  @ApiPropertyOptional({
    example: '1123456789',
    description: 'Teléfono del cliente (opcional, 7-15 dígitos)',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[0-9]{7,15}$/, {
    message: 'El teléfono debe tener entre 7 y 15 dígitos numéricos',
  })
  phone?: string;

  @ApiPropertyOptional({
    example: '1990-05-15',
    description: 'Fecha de nacimiento (opcional)',
  })
  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @ApiPropertyOptional({
    example: 'Av. Siempre Viva 742',
    description: 'Dirección (opcional)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @ApiPropertyOptional({
    example: 'Buenos Aires',
    description: 'Ciudad (opcional)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({
    example: 'Argentina',
    description: 'País (opcional)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;

  @ApiPropertyOptional({
    example: 'Argentina',
    description: 'Nacionalidad (opcional)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  nationality?: string;

  @ApiPropertyOptional({
    example: 'Cliente preferencial',
    description: 'Observaciones adicionales (opcional)',
  })
  @IsOptional()
  @IsString()
  observations?: string;
}
