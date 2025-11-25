import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  IsBoolean,
} from 'class-validator';

/**
 * UpdateCaracteristicaRequestDto
 * Capa: Presentation
 * Responsabilidad: DTO para actualizar una característica existente
 */
export class UpdateCaracteristicaRequestDto {
  @ApiProperty({
    description: 'Nombre de la característica',
    example: 'Wi-Fi Premium',
    required: false,
    minLength: 3,
    maxLength: 100,
  })
  @IsString()
  @IsOptional()
  @MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres' })
  @MaxLength(100, { message: 'El nombre no puede exceder 100 caracteres' })
  nombre?: string;

  @ApiProperty({
    description: 'Descripción de la característica',
    example: 'Internet inalámbrico de alta velocidad con fibra óptica',
    required: false,
    nullable: true,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500, { message: 'La descripción no puede exceder 500 caracteres' })
  descripcion?: string;

  @ApiProperty({
    description: 'Estado activo de la característica',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
