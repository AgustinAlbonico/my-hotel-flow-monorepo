import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsOptional,
} from 'class-validator';

/**
 * CreateCaracteristicaRequestDto
 * Capa: Presentation
 * Responsabilidad: DTO para crear una nueva característica
 */
export class CreateCaracteristicaRequestDto {
  @ApiProperty({
    description: 'Nombre de la característica',
    example: 'Wi-Fi',
    minLength: 3,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty({ message: 'El nombre es requerido' })
  @MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres' })
  @MaxLength(100, { message: 'El nombre no puede exceder 100 caracteres' })
  nombre: string;

  @ApiProperty({
    description: 'Descripción de la característica',
    example: 'Internet inalámbrico de alta velocidad',
    required: false,
    nullable: true,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500, { message: 'La descripción no puede exceder 500 caracteres' })
  descripcion?: string;
}
