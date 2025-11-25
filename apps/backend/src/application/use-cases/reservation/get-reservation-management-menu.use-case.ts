/**
 * Use Case: Obtener Menú de Gestión de Reservas
 * Patrón: Use Case - Clean Architecture
 * Capa: Application
 * Responsabilidad: Retornar opciones de menú según permisos del usuario
 */
import { Injectable } from '@nestjs/common';
import { ReservationMenuResponseDto } from '../../dtos/reservation/reservation-menu-response.dto';
import { ReservationMenuOptionDto } from '../../dtos/reservation/reservation-menu-option.dto';
import { AuthorizationService } from '../../../presentation/services/authorization.service';

@Injectable()
export class GetReservationManagementMenuUseCase {
  // Definición de todas las opciones del menú
  private readonly MENU_OPTIONS: Array<{
    key: string;
    label: string;
    description: string;
    icon: string;
    path: string;
    requiredAction: string;
  }> = [
    {
      key: 'create',
      label: 'Crear Reserva',
      description: 'Registrar una nueva reserva en el sistema',
      icon: 'calendar-plus',
      path: '/reservations/create',
      requiredAction: 'reservas.crear',
    },
    {
      key: 'checkin',
      label: 'Check-in',
      description: 'Realizar check-in de huéspedes',
      icon: 'calendar-check',
      path: '/reservations/checkin',
      requiredAction: 'reservas.checkin',
    },
    {
      key: 'checkout',
      label: 'Check-out',
      description: 'Realizar check-out y generar factura',
      icon: 'calendar-x',
      path: '/reservations/checkout',
      requiredAction: 'reservas.checkout',
    },
    {
      key: 'cancel',
      label: 'Cancelar Reserva',
      description: 'Cancelar una reserva existente',
      icon: 'calendar-x',
      path: '/reservations/cancel',
      requiredAction: 'reservas.cancelar',
    },
    {
      key: 'modify',
      label: 'Modificar Reserva',
      description: 'Modificar fechas o detalles de una reserva',
      icon: 'calendar-edit',
      path: '/reservations/modify',
      requiredAction: 'reservas.modificar',
    },
    {
      key: 'search',
      label: 'Buscar Reserva',
      description: 'Buscar y consultar reservas',
      icon: 'search',
      path: '/reservations/search',
      requiredAction: 'reservas.ver',
    },
    {
      key: 'occupancy',
      label: 'Ocupación Diaria',
      description: 'Ver calendario de ocupación de habitaciones',
      icon: 'chart-bar',
      path: '/reservations/occupancy',
      requiredAction: 'habitaciones.listar',
    },
  ];

  constructor(private readonly authorizationService: AuthorizationService) {}

  /**
   * Ejecutar caso de uso
   * @param userId - ID del usuario autenticado
   * @returns DTO con opciones de menú disponibles
   */
  async execute(userId: number): Promise<ReservationMenuResponseDto> {
    // Construir opciones del menú evaluando permisos
    const menuOptions = await Promise.all(
      this.MENU_OPTIONS.map(async (option) => {
        const hasPermission = await this.authorizationService.hasAllActions(
          userId,
          [option.requiredAction],
        );

        return new ReservationMenuOptionDto(
          option.key,
          option.label,
          option.description,
          option.icon,
          option.path,
          option.requiredAction,
          hasPermission,
        );
      }),
    );

    return new ReservationMenuResponseDto(menuOptions);
  }
}
