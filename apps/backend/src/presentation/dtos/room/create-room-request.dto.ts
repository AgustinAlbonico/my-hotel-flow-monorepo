import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  IsPositive,
} from 'class-validator';

/**
 * CreateRoomRequestDto
 * Patrón: DTO con validación y documentación Swagger
 * Capa: Presentation
 * Responsabilidad: Validar y documentar datos de entrada para crear habitación
 */
export class CreateRoomRequestDto {
  @ApiProperty({
    description: 'Número identificador de la habitación',
    example: '101',
  })
  @IsString()
  numeroHabitacion: string;

  @ApiProperty({
    description: 'ID del tipo de habitación',
    example: 1,
  })
  @IsNumber()
  @IsPositive()
  roomTypeId: number;

  @ApiProperty({
    description: 'Descripción adicional de la habitación',
    example: 'Habitación con vista al jardín',
    required: false,
  })
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiProperty({
    description: 'Características adicionales específicas de esta habitación',
    example: ['Vista al jardín', 'Balcón privado'],
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  caracteristicasAdicionales?: string[];
}
