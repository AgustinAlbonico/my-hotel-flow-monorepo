/**
 * Reservation Domain Entity
 * Patrón: Domain Entity - Clean Architecture
 * Capa: Domain
 * Responsabilidad: Representar la entidad de negocio Reserva sin dependencias externas
 */

import type { CheckInRecord } from '../value-objects/check-in-record.value-object';
import type { CheckOutRecord } from '../value-objects/check-out-record.value-object';

export enum ReservationStatus {
  CONFIRMED = 'CONFIRMED', // Confirmada
  IN_PROGRESS = 'IN_PROGRESS', // En curso
  CANCELLED = 'CANCELLED', // Cancelada
  COMPLETED = 'COMPLETED', // Finalizada
}

export class Reservation {
  private readonly _id: number;
  private readonly _code: string;
  private readonly _clientId: number;
  private readonly _roomId: number;
  private _checkIn: Date;
  private _checkOut: Date;
  private _status: ReservationStatus;
  private _cancelReason: string | null;
  private _version: number;
  private _idempotencyKey: string | null;
  private _checkInData: CheckInRecord | null;
  private _checkOutData: CheckOutRecord | null;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  constructor(
    id: number,
    code: string,
    clientId: number,
    roomId: number,
    checkIn: Date,
    checkOut: Date,
    status: ReservationStatus,
    cancelReason: string | null,
    createdAt: Date,
    updatedAt: Date,
    version: number = 0,
    idempotencyKey: string | null = null,
    checkInData: CheckInRecord | null = null,
    checkOutData: CheckOutRecord | null = null,
  ) {
    this._id = id;
    this._code = code;
    this._clientId = clientId;
    this._roomId = roomId;
    this._checkIn = checkIn;
    this._checkOut = checkOut;
    this._status = status;
    this._cancelReason = cancelReason;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
    this._version = version;
    this._idempotencyKey = idempotencyKey;
    this._checkInData = checkInData;
    this._checkOutData = checkOutData;
  }

  // Getters
  get id(): number {
    return this._id;
  }

  get code(): string {
    return this._code;
  }

  get clientId(): number {
    return this._clientId;
  }

  get roomId(): number {
    return this._roomId;
  }

  get checkIn(): Date {
    return this._checkIn;
  }

  get checkOut(): Date {
    return this._checkOut;
  }

  get status(): ReservationStatus {
    return this._status;
  }

  get cancelReason(): string | null {
    return this._cancelReason;
  }

  get version(): number {
    return this._version;
  }

  get idempotencyKey(): string | null {
    return this._idempotencyKey;
  }

  get checkInData(): CheckInRecord | null {
    return this._checkInData;
  }

  get checkOutData(): CheckOutRecord | null {
    return this._checkOutData;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  // Métodos de negocio

  /**
   * Factory method para crear una nueva reserva
   */
  static create(
    clientId: number,
    roomId: number,
    checkIn: Date,
    checkOut: Date,
    idempotencyKey: string | null = null,
  ): Reservation {
    if (checkOut <= checkIn) {
      throw new Error('La fecha de check-out debe ser posterior al check-in');
    }

    // Generar código de reserva único (formato: RES-TIMESTAMP)
    const code = `RES-${Date.now()}`;

    const now = new Date();
    return new Reservation(
      0, // El ID será asignado por la base de datos
      code,
      clientId,
      roomId,
      checkIn,
      checkOut,
      ReservationStatus.CONFIRMED,
      null,
      now,
      now,
      0,
      idempotencyKey,
    );
  }

  /**
   * Cancelar reserva con motivo
   * @param reason - Motivo de cancelación (máximo 100 caracteres)
   * @throws Error si la reserva no está en estado CONFIRMED
   */
  cancel(reason: string): void {
    if (this._status !== ReservationStatus.CONFIRMED) {
      throw new Error('Solo se pueden cancelar reservas en estado CONFIRMADA');
    }

    if (!reason || reason.trim().length === 0) {
      throw new Error('Debe proporcionar un motivo de cancelación');
    }

    if (reason.length > 100) {
      throw new Error('El motivo no puede exceder los 100 caracteres');
    }

    this._status = ReservationStatus.CANCELLED;
    this._cancelReason = reason.trim();
    this._updatedAt = new Date();
  }

  /**
   * Modificar fechas de check-in y check-out
   * @param checkIn - Nueva fecha de check-in
   * @param checkOut - Nueva fecha de check-out
   * @throws Error si las fechas son inválidas o la reserva no se puede modificar
   */
  modifyDates(checkIn: Date, checkOut: Date): void {
    if (this._status === ReservationStatus.CANCELLED) {
      throw new Error('No se puede modificar una reserva cancelada');
    }

    if (this._status === ReservationStatus.COMPLETED) {
      throw new Error('No se puede modificar una reserva completada');
    }

    if (checkOut <= checkIn) {
      throw new Error('La fecha de check-out debe ser posterior al check-in');
    }

    this._checkIn = checkIn;
    this._checkOut = checkOut;
    this._updatedAt = new Date();
  }

  /**
   * Marcar reserva como en progreso (check-in realizado)
   */
  startCheckIn(checkInRecord?: CheckInRecord): void {
    if (this._status !== ReservationStatus.CONFIRMED) {
      throw new Error('Solo se puede iniciar check-in de reservas confirmadas');
    }

    this._status = ReservationStatus.IN_PROGRESS;
    if (checkInRecord) {
      this._checkInData = checkInRecord;
    }
    this._updatedAt = new Date();
  }

  /**
   * Completar reserva (check-out realizado)
   */
  complete(checkOutRecord?: CheckOutRecord): void {
    if (this._status !== ReservationStatus.IN_PROGRESS) {
      throw new Error('Solo se pueden completar reservas en progreso');
    }

    this._status = ReservationStatus.COMPLETED;
    if (checkOutRecord) {
      this._checkOutData = checkOutRecord;
    }
    this._updatedAt = new Date();
  }

  /**
   * Calcular cantidad de noches
   */
  calculateNights(): number {
    const diffTime = Math.abs(
      this._checkOut.getTime() - this._checkIn.getTime(),
    );
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  /**
   * Verificar si la reserva está activa (confirmada o en progreso)
   */
  isActive(): boolean {
    return (
      this._status === ReservationStatus.CONFIRMED ||
      this._status === ReservationStatus.IN_PROGRESS
    );
  }

  /**
   * Verificar si la reserva puede ser cancelada (R-200)
   * @param currentDate - Fecha actual para validar política de 24h
   * @returns true si puede ser cancelada
   */
  canBeCancelled(currentDate: Date = new Date()): boolean {
    // Si ya está cancelada, no puede cancelarse de nuevo
    if (this._status === ReservationStatus.CANCELLED) {
      return false;
    }

    // Si ya está completada, no puede cancelarse
    if (this._status === ReservationStatus.COMPLETED) {
      return false;
    }

    // Si está confirmada, verificar política de 24 horas
    if (this._status === ReservationStatus.CONFIRMED) {
      return this.isWithinCancellationWindow(currentDate);
    }

    // Estados IN_PROGRESS pueden cancelarse (caso edge)
    return true;
  }

  /**
   * Verificar si está dentro de la ventana de cancelación (>= 24h antes del check-in)
   * @param currentDate - Fecha actual
   * @returns true si faltan más de 24 horas para el check-in
   */
  isWithinCancellationWindow(currentDate: Date = new Date()): boolean {
    const hoursUntilCheckIn =
      (this._checkIn.getTime() - currentDate.getTime()) / (1000 * 60 * 60);
    return hoursUntilCheckIn >= 24;
  }

  /**
   * Verificar si la reserva puede ser modificada (R-007)
   * Solo se pueden modificar reservas en estado CONFIRMED
   */
  canBeModified(): boolean {
    return this._status === ReservationStatus.CONFIRMED;
  }

  /**
   * Calcular precio total de la reserva
   * @param pricePerNight - Precio por noche de la habitación
   */
  calculateTotalPrice(pricePerNight: number): number {
    if (pricePerNight < 0) {
      throw new Error('El precio por noche no puede ser negativo');
    }
    return this.calculateNights() * pricePerNight;
  }

  /**
   * Validar que la duración de la reserva esté dentro de los límites (R-003, R-004)
   * @throws Error si la duración es inválida
   */
  validateDuration(): void {
    const nights = this.calculateNights();

    if (nights < 1) {
      throw new Error('La reserva debe ser de al menos 1 noche');
    }

    if (nights > 30) {
      throw new Error('Las reservas no pueden exceder 30 noches');
    }
  }
}
