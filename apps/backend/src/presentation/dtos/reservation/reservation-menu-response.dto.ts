/**
 * DTO: Respuesta del menú de gestión de reservas (Presentation Layer)
 * Capa: Presentation
 * Responsabilidad: Definir estructura de respuesta API para el menú
 */
import { ApiProperty } from '@nestjs/swagger';
import { ReservationMenuOptionResponseDto } from './reservation-menu-option-response.dto';

export class ReservationMenuResponsePresentationDto {
  @ApiProperty({
    type: [ReservationMenuOptionResponseDto],
    description: 'Lista de opciones del menú',
  })
  options: ReservationMenuOptionResponseDto[];

  @ApiProperty({ example: 5, description: 'Total de opciones disponibles' })
  totalOptions: number;

  @ApiProperty({
    example: 3,
    description: 'Opciones disponibles según permisos del usuario',
  })
  availableOptions: number;
}
