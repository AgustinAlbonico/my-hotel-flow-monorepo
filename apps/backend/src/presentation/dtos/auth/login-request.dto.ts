import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Login Request DTO
 * DTO de presentación para solicitudes de login con validaciones
 *
 * Acepta 'identity' que puede ser username o email para compatibilidad
 * con el frontend existente
 */
export class LoginRequestDto {
  @ApiProperty({
    description: 'Username o email para autenticación',
    example: 'admin',
  })
  @IsString()
  @IsNotEmpty()
  identity: string;

  @ApiProperty({
    description: 'Contraseña para autenticación',
    example: 'Admin123!',
    minLength: 8,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  password: string;
}
