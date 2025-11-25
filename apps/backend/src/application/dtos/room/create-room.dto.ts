/**
 * CreateRoomDto
 * Patrón: DTO (Data Transfer Object)
 * Capa: Application
 * Responsabilidad: Transportar datos para crear una habitación
 */
export class CreateRoomDto {
  numeroHabitacion: string;
  roomTypeId: number;
  descripcion?: string | null;
  caracteristicasAdicionales?: string[];
}
