import { RoomStatus } from '../../../domain/entities/room.entity';

/**
 * RoomResponseDto
 * Patrón: DTO (Data Transfer Object)
 * Capa: Application
 * Responsabilidad: Transportar datos de respuesta de una habitación
 */
export class RoomResponseDto {
  id: number;
  numeroHabitacion: string;
  tipo: string; // Código del tipo (string único, ej: "estandar", "suite-deluxe")
  tipoNombre: string; // Nombre descriptivo del tipo
  estado: RoomStatus;
  capacidad: number; // Viene del RoomType
  precioPorNoche: number; // Viene del RoomType
  descripcion: string | null;
  caracteristicas: string[]; // Incluye las del tipo + adicionales
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
