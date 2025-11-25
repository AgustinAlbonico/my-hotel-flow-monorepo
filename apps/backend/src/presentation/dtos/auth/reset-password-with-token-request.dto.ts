import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Reset Password With Token Request DTO
 * DTO de presentación para reseteo de contraseña usando token
 */
export class ResetPasswordWithTokenRequestDto {
  @ApiProperty({
    description: 'Token de recuperación de contraseña recibido por email',
    example: 'a1b2c3d4e5f6...',
  })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({
    description: 'Nueva contraseña',
    example: 'NewPassword123!',
    minLength: 8,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8, {
    message: 'La nueva contraseña debe tener al menos 8 caracteres',
  })
  newPassword: string;
}
