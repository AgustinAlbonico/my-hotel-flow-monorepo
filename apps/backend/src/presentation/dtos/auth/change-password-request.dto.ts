import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Change Password Request DTO
 * DTO de presentación para solicitudes de cambio de contraseña
 */
export class ChangePasswordRequestDto {
  @ApiProperty({
    description: 'Contraseña actual para verificación',
    example: 'OldPassword123!',
  })
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

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
