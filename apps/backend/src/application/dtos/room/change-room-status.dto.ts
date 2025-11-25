/**
 * ChangeRoomStatusDto
 * Patrón: DTO (Data Transfer Object)
 * Capa: Application
 * Responsabilidad: Transportar datos para cambiar el estado de una habitación
 */
export class ChangeRoomStatusDto {
  status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'OUT_OF_SERVICE';
}
