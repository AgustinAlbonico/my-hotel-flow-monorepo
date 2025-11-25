import { CaracteristicaResponseDto } from '../caracteristica/caracteristica-response.dto';

/**
 * RoomTypeResponseDto
 * Patrón: DTO (Data Transfer Object)
 * Capa: Application
 * Responsabilidad: Transportar datos de respuesta de un tipo de habitación
 */
export class RoomTypeResponseDto {
  id: number;
  code: string;
  name: string;
  precioPorNoche: number;
  capacidadMaxima: number;
  descripcion: string | null;
  caracteristicas: CaracteristicaResponseDto[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
