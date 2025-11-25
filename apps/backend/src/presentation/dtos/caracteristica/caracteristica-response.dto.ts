import { ApiProperty } from '@nestjs/swagger';

/**
 * CaracteristicaResponseDto
 * Capa: Presentation
 * Responsabilidad: Estructura de respuesta para características
 */
export class CaracteristicaResponseDto {
  @ApiProperty({ description: 'ID de la característica', example: 1 })
  id: number;

  @ApiProperty({ description: 'Nombre de la característica', example: 'Wi-Fi' })
  nombre: string;

  @ApiProperty({
    description: 'Descripción de la característica',
    example: 'Internet inalámbrico de alta velocidad',
    nullable: true,
  })
  descripcion: string | null;

  @ApiProperty({ description: 'Estado activo', example: true })
  isActive: boolean;

  @ApiProperty({ description: 'Fecha de creación' })
  createdAt: Date;

  @ApiProperty({ description: 'Fecha de última actualización' })
  updatedAt: Date;
}
