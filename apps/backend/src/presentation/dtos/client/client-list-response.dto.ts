/**
 * Client List Response DTO
 * DTO para la respuesta de lista de clientes
 */

import { ApiProperty } from '@nestjs/swagger';

export class ClientListItemResponseDto {
  @ApiProperty({ example: 1, description: 'ID del cliente' })
  id: number;

  @ApiProperty({ example: '12345678', description: 'DNI del cliente' })
  dni: string;

  @ApiProperty({ example: 'Juan', description: 'Nombre del cliente' })
  firstName: string;

  @ApiProperty({ example: 'Pérez', description: 'Apellido del cliente' })
  lastName: string;

  @ApiProperty({
    example: 'juan.perez@email.com',
    description: 'Email del cliente',
  })
  email: string;

  @ApiProperty({
    example: '1234567890',
    description: 'Teléfono del cliente',
    nullable: true,
  })
  phone: string | null;

  @ApiProperty({ example: true, description: 'Si el cliente está activo' })
  isActive: boolean;

  @ApiProperty({
    example: '2025-01-15T10:00:00.000Z',
    description: 'Fecha de creación',
  })
  createdAt: string;

  @ApiProperty({
    example: '2025-01-15T10:00:00.000Z',
    description: 'Fecha de última actualización',
  })
  updatedAt: string;
}
