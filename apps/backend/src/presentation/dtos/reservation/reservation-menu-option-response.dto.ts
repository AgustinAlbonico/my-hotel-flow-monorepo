/**
 * DTO: Respuesta de opción del menú de reservas (Presentation Layer)
 * Capa: Presentation
 * Responsabilidad: Definir estructura de respuesta API para opciones de menú
 */
import { ApiProperty } from '@nestjs/swagger';

export class ReservationMenuOptionResponseDto {
  @ApiProperty({
    example: 'create',
    description: 'Identificador único de la opción',
  })
  key: string;

  @ApiProperty({
    example: 'Crear Reserva',
    description: 'Etiqueta descriptiva',
  })
  label: string;

  @ApiProperty({ example: 'Registrar una nueva reserva en el sistema' })
  description: string;

  @ApiProperty({ example: 'calendar-plus', description: 'Nombre del icono' })
  icon: string;

  @ApiProperty({
    example: '/reservations/create',
    description: 'Ruta de navegación',
  })
  path: string;

  @ApiProperty({ example: 'reservas.crear', description: 'Acción requerida' })
  requiredAction: string;

  @ApiProperty({
    example: true,
    description: 'Indica si el usuario tiene permiso',
  })
  isAvailable: boolean;
}
