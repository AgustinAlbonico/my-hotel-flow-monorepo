/**
 * ListRoomsFiltersDto
 * Patrón: DTO (Data Transfer Object)
 * Capa: Application
 * Responsabilidad: Transportar filtros para listar habitaciones
 */
export class ListRoomsFiltersDto {
  tipo?: 'ESTANDAR' | 'SUITE' | 'FAMILIAR';
  estado?: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'OUT_OF_SERVICE';
  capacidadMinima?: number;
  precioMaximo?: number;
  onlyActive?: boolean;
}
