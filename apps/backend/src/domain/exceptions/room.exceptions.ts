/**
 * Room Domain Exceptions
 * Patrón: Domain Exception
 * Capa: Domain
 * Responsabilidad: Excepciones específicas del dominio de habitaciones
 */

export class RoomAlreadyExistsException extends Error {
  constructor(numeroHabitacion: string) {
    super(`Habitación con número ${numeroHabitacion} ya existe`);
    this.name = 'RoomAlreadyExistsException';
  }
}

export class RoomNotFoundException extends Error {
  constructor(id: number) {
    super(`Habitación con ID ${id} no encontrada`);
    this.name = 'RoomNotFoundException';
  }
}

export class RoomOccupiedException extends Error {
  constructor(numeroHabitacion: string) {
    super(
      `Habitación ${numeroHabitacion} está ocupada y no puede ser modificada`,
    );
    this.name = 'RoomOccupiedException';
  }
}
