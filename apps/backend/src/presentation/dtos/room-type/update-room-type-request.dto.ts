import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  Min,
  Max,
  IsInt,
} from 'class-validator';

/**
 * UpdateRoomTypeRequestDto
 * Capa: Presentation
 * Responsabilidad: Validar datos de entrada para actualizar tipo de habitación
 */
export class UpdateRoomTypeRequestDto {
  @ApiProperty({
    description: 'Nombre del tipo de habitación',
    example: 'Habitación Estándar Premium',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'Precio por noche',
    example: 1800,
    minimum: 0,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  precioPorNoche?: number;

  @ApiProperty({
    description: 'Capacidad máxima de personas',
    example: 3,
    minimum: 1,
    maximum: 10,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  capacidadMaxima?: number;

  @ApiProperty({
    description: 'Descripción del tipo de habitación',
    example: 'Habitación renovada con mejoras',
    required: false,
  })
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiProperty({
    description: 'IDs de características a asociar con este tipo',
    example: [1, 2, 3, 4],
    required: false,
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  caracteristicasIds?: number[];
}
