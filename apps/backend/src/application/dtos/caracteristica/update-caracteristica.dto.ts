/**
 * UpdateCaracteristicaDto
 * Patrón: DTO (Data Transfer Object)
 * Capa: Application
 * Responsabilidad: Transportar datos para actualizar una característica
 */
export class UpdateCaracteristicaDto {
  nombre?: string;
  descripcion?: string;
  isActive?: boolean;
}
