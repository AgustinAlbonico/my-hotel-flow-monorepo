/**
 * Reset Password Request DTO
 * DTO de presentación para resetear contraseña (admin action)
 */

import { IsString, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordRequestDto {
  @ApiProperty({
    description: 'New password',
    example: 'NewSecurePass123!',
    minLength: 8,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  newPassword: string;
}
