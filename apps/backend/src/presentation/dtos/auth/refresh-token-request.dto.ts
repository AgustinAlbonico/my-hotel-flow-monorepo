import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Refresh Token Request DTO
 * DTO de presentación para solicitudes de renovación de token
 */
export class RefreshTokenRequestDto {
  @ApiProperty({
    description: 'Refresh token JWT para generar nuevo access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
