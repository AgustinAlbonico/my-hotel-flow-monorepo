import { ApiProperty } from '@nestjs/swagger';

/**
 * ClientDetailResponseDto
 * Capa: Presentation
 * DTO para respuesta de detalles completos de un cliente
 */
export class ClientDetailResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: '12345678' })
  dni: string;

  @ApiProperty({ example: 'Juan' })
  firstName: string;

  @ApiProperty({ example: 'Pérez' })
  lastName: string;

  @ApiProperty({ example: 'juan.perez@email.com' })
  email: string;

  @ApiProperty({ example: '1234567890', nullable: true })
  phone: string | null;

  @ApiProperty({ example: '1990-05-15', nullable: true })
  birthDate: string | null;

  @ApiProperty({ example: 'Av. Siempre Viva 742', nullable: true })
  address: string | null;

  @ApiProperty({ example: 'Buenos Aires', nullable: true })
  city: string | null;

  @ApiProperty({ example: 'Argentina', nullable: true })
  country: string | null;

  @ApiProperty({ example: 'Argentina', nullable: true })
  nationality: string | null;

  @ApiProperty({ example: 'Cliente preferencial', nullable: true })
  observations: string | null;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: '2025-01-15T10:30:00.000Z' })
  createdAt: string;

  @ApiProperty({ example: '2025-01-20T14:45:00.000Z' })
  updatedAt: string;
}
