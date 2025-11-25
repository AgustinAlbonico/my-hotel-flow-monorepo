import { ApiProperty } from '@nestjs/swagger';

/**
 * RoomResponseDto
 * Patrón: DTO de respuesta con documentación Swagger
 * Capa: Presentation
 * Responsabilidad: Estructura de respuesta de habitación para la API
 */
export class RoomResponseDto {
  @ApiProperty({
    description: 'ID único de la habitación',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Número identificador de la habitación',
    example: '101',
  })
  numeroHabitacion: string;

  @ApiProperty({
    description: 'Tipo de habitación',
    enum: ['ESTANDAR', 'SUITE', 'FAMILIAR'],
    example: 'ESTANDAR',
  })
  tipo: string;

  @ApiProperty({
    description: 'Estado actual de la habitación',
    enum: ['AVAILABLE', 'OCCUPIED', 'MAINTENANCE', 'OUT_OF_SERVICE'],
    example: 'AVAILABLE',
  })
  estado: string;

  @ApiProperty({
    description: 'Capacidad máxima de personas',
    example: 2,
  })
  capacidad: number;

  @ApiProperty({
    description: 'Precio por noche',
    example: 100.5,
  })
  precioPorNoche: number;

  @ApiProperty({
    description: 'Descripción de la habitación',
    example: 'Habitación amplia con vista al mar',
    nullable: true,
  })
  descripcion: string | null;

  @ApiProperty({
    description: 'Características de la habitación',
    example: ['WiFi', 'TV', 'Aire acondicionado'],
    type: [String],
  })
  caracteristicas: string[];

  @ApiProperty({
    description: 'Indica si la habitación está activa',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Fecha de creación',
    example: '2025-11-02T10:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Fecha de última actualización',
    example: '2025-11-02T10:00:00Z',
  })
  updatedAt: Date;
}
