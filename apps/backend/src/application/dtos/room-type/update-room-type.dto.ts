/**
 * UpdateRoomTypeDto
 * Patrón: DTO (Data Transfer Object)
 * Capa: Application
 * Responsabilidad: Transportar datos para actualizar un tipo de habitación
 */
export class UpdateRoomTypeDto {
  name?: string;
  precioPorNoche?: number;
  capacidadMaxima?: number;
  descripcion?: string | null;
  caracteristicasIds?: number[];
}
