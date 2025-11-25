import { Room } from '../entities/room.entity';
import { DateRange } from '../value-objects/date-range.value-object';

/**
 * IRoomRepository
 * Patrón: Repository Interface - Clean Architecture
 * Capa: Domain
 * Responsabilidad: Definir contrato para operaciones de persistencia de Habitación
 */
export interface IRoomRepository {
  /**
   * Buscar habitación por ID
   */
  findById(id: number): Promise<Room | null>;

  /**
   * Buscar habitación por número
   */
  findByNumero(numeroHabitacion: string): Promise<Room | null>;

  /**
   * Buscar todas las habitaciones activas
   */
  findAllActive(): Promise<Room[]>;

  /**
   * Buscar habitaciones disponibles para un rango de fechas y tipo
   * Debe verificar que la habitación:
   * - Esté activa (isActive = true)
   * - Esté en estado AVAILABLE
   * - No tenga reservas confirmadas o en progreso que se superpongan con el rango
   */
  findAvailableRooms(
    dateRange: DateRange,
    roomTypeCode: string,
    capacity?: number,
  ): Promise<Room[]>;

  /**
   * Crear una nueva habitación
   */
  create(room: Room): Promise<Room>;

  /**
   * Actualizar una habitación existente
   */
  update(room: Room): Promise<Room>;

  /**
   * Verificar disponibilidad de una habitación específica en un rango de fechas
   */
  isRoomAvailable(roomId: number, dateRange: DateRange): Promise<boolean>;
}
