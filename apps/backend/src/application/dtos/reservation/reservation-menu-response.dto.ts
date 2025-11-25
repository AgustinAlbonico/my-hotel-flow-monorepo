/**
 * DTO: Respuesta del menú de gestión de reservas
 * Capa: Application
 * Responsabilidad: Retornar las opciones de menú disponibles según permisos
 */
import { ReservationMenuOptionDto } from './reservation-menu-option.dto';

export class ReservationMenuResponseDto {
  options: ReservationMenuOptionDto[];
  totalOptions: number;
  availableOptions: number;

  constructor(options: ReservationMenuOptionDto[]) {
    this.options = options;
    this.totalOptions = options.length;
    this.availableOptions = options.filter((opt) => opt.isAvailable).length;
  }
}
