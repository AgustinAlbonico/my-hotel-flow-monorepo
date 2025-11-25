/**
 * CreateRoomTypeDto
 * Patrón: DTO (Data Transfer Object)
 * Capa: Application
 * Responsabilidad: Transportar datos para crear un tipo de habitación
 */
export class CreateRoomTypeDto {
  code: string;
  name: string;
  precioPorNoche: number;
  capacidadMaxima: number;
  descripcion?: string | null;
  caracteristicasIds?: number[];
}
