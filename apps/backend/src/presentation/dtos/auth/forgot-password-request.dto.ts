import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Forgot Password Request DTO
 * DTO de presentación para solicitudes de recuperación de contraseña
 */
export class ForgotPasswordRequestDto {
  @ApiProperty({
    description: 'Email del usuario para enviar el token de recuperación',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'Debe proporcionar un email válido' })
  @IsNotEmpty()
  email: string;
}
