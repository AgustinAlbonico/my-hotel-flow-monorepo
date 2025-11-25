import { ApiProperty } from '@nestjs/swagger';
import { CaracteristicaResponseDto } from '../caracteristica/caracteristica-response.dto';

/**
 * RoomTypeResponseDto
 * Capa: Presentation
 * Responsabilidad: Estructura de respuesta para tipo de habitación
 */
export class RoomTypeResponseDto {
  @ApiProperty({ description: 'ID del tipo de habitación', example: 1 })
  id: number;

  @ApiProperty({
    description: 'Código del tipo',
    example: 'estandar',
  })
  code: string;

  @ApiProperty({
    description: 'Nombre del tipo',
    example: 'Habitación Estándar',
  })
  name: string;

  @ApiProperty({ description: 'Precio por noche', example: 1500 })
  precioPorNoche: number;

  @ApiProperty({ description: 'Capacidad máxima', example: 2 })
  capacidadMaxima: number;

  @ApiProperty({
    description: 'Descripción del tipo',
    example: 'Habitación cómoda con comodidades básicas',
    nullable: true,
  })
  descripcion: string | null;

  @ApiProperty({
    description: 'Características incluidas',
    type: [CaracteristicaResponseDto],
  })
  caracteristicas: CaracteristicaResponseDto[];

  @ApiProperty({ description: 'Estado activo', example: true })
  isActive: boolean;

  @ApiProperty({ description: 'Fecha de creación' })
  createdAt: Date;

  @ApiProperty({ description: 'Fecha de última actualización' })
  updatedAt: Date;
}
