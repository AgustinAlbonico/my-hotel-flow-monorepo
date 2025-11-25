/**
 * RoomStatus Enum
 * Estado de disponibilidad de la habitación
 * Patrón: Domain Enum
 * Capa: Domain
 */
export enum RoomStatus {
  AVAILABLE = 'AVAILABLE', // Disponible para reservar
  OCCUPIED = 'OCCUPIED', // Ocupada por una reserva en curso
  MAINTENANCE = 'MAINTENANCE', // En mantenimiento
  OUT_OF_SERVICE = 'OUT_OF_SERVICE', // Fuera de servicio
}
