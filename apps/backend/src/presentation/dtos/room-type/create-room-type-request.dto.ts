import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  Min,
  Max,
  Matches,
  MinLength,
  MaxLength,
  IsInt,
} from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * CreateRoomTypeRequestDto
 * Capa: Presentation
 * Responsabilidad: Validar datos de entrada para crear tipo de habitación
 */
export class CreateRoomTypeRequestDto {
  @ApiProperty({
    description:
      'Código único del tipo de habitación (solo minúsculas, números y guiones)',
    example: 'estandar',
    minLength: 2,
    maxLength: 50,
  })
  @IsString()
  @MinLength(2, { message: 'El código debe tener al menos 2 caracteres' })
  @MaxLength(50, { message: 'El código no puede exceder 50 caracteres' })
  @Transform(({ value }: { value: string }) =>
    typeof value === 'string' ? value.toLowerCase().trim() : value,
  ) // Convertir automáticamente a minúsculas y eliminar espacios
  @Matches(/^[a-z0-9-]+$/, {
    message:
      'El código solo puede contener letras minúsculas, números y guiones',
  })
  code: string;

  @ApiProperty({
    description: 'Nombre del tipo de habitación',
    example: 'Habitación Estándar',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Precio por noche',
    example: 1500,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  precioPorNoche: number;

  @ApiProperty({
    description: 'Capacidad máxima de personas',
    example: 2,
    minimum: 1,
    maximum: 10,
  })
  @IsNumber()
  @Min(1)
  @Max(10)
  capacidadMaxima: number;

  @ApiProperty({
    description: 'Descripción del tipo de habitación',
    example: 'Habitación cómoda con todas las comodidades básicas',
    required: false,
  })
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiProperty({
    description: 'IDs de características a asociar con este tipo',
    example: [1, 2, 3],
    required: false,
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  caracteristicasIds?: number[];
}
