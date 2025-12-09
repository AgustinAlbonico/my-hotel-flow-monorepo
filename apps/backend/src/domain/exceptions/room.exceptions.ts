/**
 * Room Domain Exceptions
 * Patrón: Domain Exception
 * Capa: Domain
 * Responsabilidad: Excepciones específicas del dominio de habitaciones
 */

import { HttpStatus } from '@nestjs/common';
import { DomainException } from './domain.exception';

export class RoomAlreadyExistsException extends DomainException {
  constructor(numeroHabitacion: string) {
    super(
      `Habitación con número ${numeroHabitacion} ya existe`,
      HttpStatus.CONFLICT,
      'ROOM_ALREADY_EXISTS',
    );
  }
}

export class RoomNotFoundException extends DomainException {
  constructor(id: number) {
    super(
      `Habitación con ID ${id} no encontrada`,
      HttpStatus.NOT_FOUND,
      'ROOM_NOT_FOUND',
    );
  }
}

export class RoomOccupiedException extends DomainException {
  constructor(numeroHabitacion: string) {
    super(
      `Habitación ${numeroHabitacion} está ocupada y no puede ser modificada`,
      HttpStatus.CONFLICT,
      'ROOM_OCCUPIED',
    );
  }
}
