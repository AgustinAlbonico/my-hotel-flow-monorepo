import { Reservation, ReservationStatus } from '../entities/reservation.entity';

/**
 * IReservationRepository
 * Patrón: Repository Interface - Clean Architecture
 * Capa: Domain
 * Responsabilidad: Definir contrato para operaciones de persistencia de Reserva
 */
export interface IReservationRepository {
  /**
   * Buscar reserva por ID
   */
  findById(id: number): Promise<Reservation | null>;

  /**
   * Buscar reserva por código
   */
  findByCode(code: string): Promise<Reservation | null>;

  /**
   * Buscar reserva por DNI del cliente
   */
  findByClientDni(dni: string): Promise<Reservation | null>;

  /**
   * Crear una nueva reserva
   */
  save(reservation: Reservation): Promise<Reservation>;

  /**
   * Actualizar una reserva existente
   */
  update(reservation: Reservation): Promise<Reservation>;

  /**
   * Buscar reservas que se solapen con las fechas dadas para una habitación
   */
  findOverlappingReservations(
    roomId: number,
    checkIn: Date,
    checkOut: Date,
    excludeReservationId?: number,
  ): Promise<Reservation[]>;

  /**
   * Buscar reserva por idempotency key
   */
  findByIdempotencyKey(key: string): Promise<Reservation | null>;

  /**
   * Contar reservas pendientes/activas de un cliente
   */
  countPendingByClient(clientId: number): Promise<number>;

  /**
   * Verificar si un cliente tiene reservas activas (por ejemplo, CONFIRMED o IN_PROGRESS)
   */
  hasActiveReservationByClient(clientId: number): Promise<boolean>;

  /**
   * Buscar reserva con lock pesimista (SELECT FOR UPDATE)
   * @param id - ID de la reserva
   * @param transactionManager - EntityManager para transacción
   */
  findWithLock(
    id: number,
    transactionManager?: any,
  ): Promise<Reservation | null>;

  /**
   * Listar reservas con filtros y paginación
   */
  findAll(filters: {
    status?: ReservationStatus;
    checkInFrom?: Date;
    checkInTo?: Date;
    clientId?: number;
    roomId?: number;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: ReservationListItemView[]; total: number }>;
}

export interface ReservationClientSummary {
  id: number;
  dni: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
}

export interface ReservationRoomSummary {
  id: number;
  numeroHabitacion: string;
  roomTypeCode?: string;
  roomTypeName?: string;
  estado: string;
  pricePerNight?: number;
}

export interface ReservationListItemView {
  id: number;
  code: string;
  clientId: number;
  roomId: number | null;
  status: ReservationStatus;
  checkIn: Date;
  checkOut: Date;
  createdAt: Date;
  updatedAt: Date;
  totalNights: number;
  totalPrice?: number;
  client?: ReservationClientSummary | null;
  room?: ReservationRoomSummary | null;
}
