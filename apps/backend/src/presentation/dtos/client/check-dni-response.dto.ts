import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de respuesta para verificación de DNI
 * Capa: Presentation
 */
export class CheckDniResponseDto {
  @ApiProperty({ example: false, description: 'Indica si el DNI existe' })
  exists: boolean;

  @ApiProperty({
    example: 'DNI disponible',
    description: 'Mensaje descriptivo',
  })
  message: string;

  @ApiProperty({
    example: 1,
    description: 'ID del cliente si existe',
    required: false,
  })
  clientId?: number;
}
