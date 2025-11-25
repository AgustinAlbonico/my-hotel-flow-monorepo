/**
 * CaracteristicaResponseDto
 * Patrón: DTO (Data Transfer Object)
 * Capa: Application
 * Responsabilidad: Transportar datos de respuesta de características
 */
export class CaracteristicaResponseDto {
  id: number;
  nombre: string;
  descripcion: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
