/**
 * DTO: Opción del menú de gestión de reservas
 * Capa: Application
 * Responsabilidad: Representar una opción del menú de gestión
 */
export class ReservationMenuOptionDto {
  key: string;
  label: string;
  description: string;
  icon: string;
  path: string;
  requiredAction: string;
  isAvailable: boolean;

  constructor(
    key: string,
    label: string,
    description: string,
    icon: string,
    path: string,
    requiredAction: string,
    isAvailable: boolean,
  ) {
    this.key = key;
    this.label = label;
    this.description = description;
    this.icon = icon;
    this.path = path;
    this.requiredAction = requiredAction;
    this.isAvailable = isAvailable;
  }
}
