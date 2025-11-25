import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

/**
 * ChangeRoomStatusRequestDto
 * Patrón: DTO con validación y documentación Swagger
 * Capa: Presentation
 * Responsabilidad: Validar y documentar datos para cambiar estado de habitación
 */
export class ChangeRoomStatusRequestDto {
  @ApiProperty({
    description: 'Nuevo estado de la habitación',
    enum: ['AVAILABLE', 'OCCUPIED', 'MAINTENANCE', 'OUT_OF_SERVICE'],
    example: 'MAINTENANCE',
  })
  @IsEnum(['AVAILABLE', 'OCCUPIED', 'MAINTENANCE', 'OUT_OF_SERVICE'])
  status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'OUT_OF_SERVICE';
}
