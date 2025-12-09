/**
 * Reservation Domain Exceptions
 * Patrón: Domain Exception
 * Capa: Domain
 * Responsabilidad: Excepciones específicas del dominio de reservaciones
 */

import { HttpStatus } from '@nestjs/common';
import { DomainException } from './domain.exception';

/**
 * Excepción lanzada cuando no se encuentra una reservación
 */
export class ReservationNotFoundException extends DomainException {
  constructor(identifier: string | number) {
    super(
      `Reservación con identificador ${identifier} no encontrada`,
      HttpStatus.NOT_FOUND,
      'RESERVATION_NOT_FOUND',
    );
  }
}

/**
 * Excepción lanzada cuando el cliente no se encuentra
 */
export class ClientNotFoundForReservationException extends DomainException {
  constructor(clientId: number) {
    super(
      `Cliente con ID ${clientId} no encontrado`,
      HttpStatus.NOT_FOUND,
      'CLIENT_NOT_FOUND',
    );
  }
}

/**
 * Excepción lanzada cuando el cliente está inactivo
 */
export class ClientInactiveException extends DomainException {
  constructor(clientId: number) {
    super(
      `El cliente con ID ${clientId} está inactivo`,
      HttpStatus.BAD_REQUEST,
      'CLIENT_INACTIVE',
    );
  }
}

/**
 * Excepción lanzada cuando el cliente tiene deuda pendiente
 */
export class ClientHasOutstandingDebtException extends DomainException {
  constructor(clientId: number, balance: number) {
    super(
      `No se puede crear la reserva. El cliente tiene un saldo pendiente de $${balance.toFixed(2)}. Por favor, regularice la situación antes de realizar una nueva reserva.`,
      HttpStatus.BAD_REQUEST,
      'CLIENT_HAS_OUTSTANDING_DEBT',
      { clientId, balance },
    );
  }
}

/**
 * Excepción lanzada cuando el cliente ya tiene una reserva activa
 */
export class ClientHasActiveReservationException extends DomainException {
  constructor(clientId: number) {
    super(
      'El cliente ya tiene una reserva activa. No se puede crear otra hasta que se complete o cancele la actual.',
      HttpStatus.BAD_REQUEST,
      'CLIENT_HAS_ACTIVE_RESERVATION',
      { clientId },
    );
  }
}

/**
 * Excepción lanzada cuando la habitación no se encuentra
 */
export class RoomNotFoundForReservationException extends DomainException {
  constructor(roomId: number) {
    super(
      `Habitación con ID ${roomId} no encontrada`,
      HttpStatus.NOT_FOUND,
      'ROOM_NOT_FOUND',
    );
  }
}

/**
 * Excepción lanzada cuando la habitación está inactiva
 */
export class RoomInactiveException extends DomainException {
  constructor(roomId: number) {
    super(
      `La habitación con ID ${roomId} está inactiva`,
      HttpStatus.BAD_REQUEST,
      'ROOM_INACTIVE',
    );
  }
}

/**
 * Excepción lanzada cuando se excede el límite de reservas pendientes
 */
export class MaxPendingReservationsException extends DomainException {
  constructor(clientId: number, limit: number) {
    super(
      `Has alcanzado el límite de ${limit} reservas pendientes. Por favor, completa o cancela alguna antes de crear una nueva.`,
      HttpStatus.BAD_REQUEST,
      'MAX_PENDING_RESERVATIONS',
      { clientId, limit },
    );
  }
}

/**
 * Excepción lanzada cuando hay conflicto de disponibilidad
 */
export class RoomNotAvailableException extends DomainException {
  constructor(roomId: number, checkIn: string, checkOut: string) {
    super(
      'La habitación no está disponible para las fechas seleccionadas. Ya existe una reserva confirmada.',
      HttpStatus.CONFLICT,
      'ROOM_NOT_AVAILABLE',
      { roomId, checkIn, checkOut },
    );
  }
}

/**
 * Excepción lanzada cuando no se puede cancelar la reserva
 */
export class ReservationCannotBeCancelledException extends DomainException {
  constructor(reservationId: number, reason: string) {
    super(
      `No se puede cancelar la reserva: ${reason}`,
      HttpStatus.BAD_REQUEST,
      'RESERVATION_CANNOT_BE_CANCELLED',
      { reservationId },
    );
  }
}

/**
 * Excepción lanzada cuando no se puede modificar la reserva
 */
export class ReservationCannotBeModifiedException extends DomainException {
  constructor(reservationId: number, reason: string) {
    super(
      `No se puede modificar la reserva: ${reason}`,
      HttpStatus.BAD_REQUEST,
      'RESERVATION_CANNOT_BE_MODIFIED',
      { reservationId },
    );
  }
}

/**
 * Excepción lanzada cuando hay conflicto de versión (optimistic locking)
 */
export class ReservationVersionConflictException extends DomainException {
  constructor(reservationId: number) {
    super(
      'La reserva fue modificada por otro usuario. Por favor, recargue e intente nuevamente.',
      HttpStatus.CONFLICT,
      'RESERVATION_VERSION_CONFLICT',
      { reservationId },
    );
  }
}

