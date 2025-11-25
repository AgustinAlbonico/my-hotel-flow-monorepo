import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsArray, IsString } from 'class-validator';

/**
 * UpdateRoomRequestDto
 * Patrón: DTO con validación y documentación Swagger
 * Capa: Presentation
 * Responsabilidad: Validar y documentar datos de entrada para actualizar habitación
 */
export class UpdateRoomRequestDto {
  @ApiProperty({
    description: 'Descripción de la habitación',
    example: 'Habitación con vista renovada al jardín',
    required: false,
  })
  @IsString()
  @IsOptional()
  descripcion?: string;

  @ApiProperty({
    description: 'Características adicionales específicas de esta habitación',
    example: ['Vista panorámica', 'Balcón reformado'],
    type: [String],
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  caracteristicasAdicionales?: string[];
}
