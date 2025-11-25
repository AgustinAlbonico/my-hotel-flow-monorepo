/**
 * UpdateRoomDto
 * Patrón: DTO (Data Transfer Object)
 * Capa: Application
 * Responsabilidad: Transportar datos para actualizar una habitación
 */
export class UpdateRoomDto {
  descripcion?: string | null;
  caracteristicasAdicionales?: string[];
}
