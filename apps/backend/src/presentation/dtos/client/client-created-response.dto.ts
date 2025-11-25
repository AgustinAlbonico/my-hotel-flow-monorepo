import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO de respuesta para cliente creado (con contraseña temporal)
 * Capa: Presentation
 */
export class ClientCreatedResponseDto {
  @ApiProperty({ example: 1, description: 'ID del cliente' })
  id: number;

  @ApiProperty({ example: '12345678', description: 'DNI del cliente' })
  dni: string;

  @ApiProperty({ example: 'Juan', description: 'Nombre del cliente' })
  firstName: string;

  @ApiProperty({ example: 'Pérez', description: 'Apellido del cliente' })
  lastName: string;

  @ApiProperty({
    example: 'juan.perez@example.com',
    description: 'Email del cliente',
  })
  email: string;

  @ApiPropertyOptional({
    example: '1123456789',
    description: 'Teléfono del cliente',
  })
  phone: string | null;

  @ApiProperty({ example: true, description: 'Si el cliente está activo' })
  isActive: boolean;

  @ApiProperty({
    example: '2025-11-01T12:00:00Z',
    description: 'Fecha de creación',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2025-11-01T12:00:00Z',
    description: 'Fecha de última actualización',
  })
  updatedAt: Date;

  @ApiProperty({
    example: 'a3f9b2c1',
    description: 'Contraseña temporal generada (8 caracteres hexadecimales)',
  })
  temporaryPassword: string;
}
