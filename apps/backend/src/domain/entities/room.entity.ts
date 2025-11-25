import { RoomType } from './room-type.entity';
import { RoomStatus } from '../enums/room.enums';

// Re-export para facilitar el uso
export { RoomType } from './room-type.entity';
export { RoomStatus } from '../enums/room.enums';

/**
 * Room Domain Entity
 * Patrón: Domain Entity - Clean Architecture
 * Capa: Domain
 * Responsabilidad: Representar la entidad de negocio Habitación
 */
export class Room {
  private readonly _id: number;
  private _numeroHabitacion: string;
  private _roomType: RoomType; // Relación con RoomType
  private _estado: RoomStatus;
  private _descripcion: string | null;
  private _caracteristicasAdicionales: string[]; // Características adicionales específicas de esta habitación
  private _isActive: boolean;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  constructor(
    id: number,
    numeroHabitacion: string,
    roomType: RoomType,
    estado: RoomStatus,
    descripcion: string | null,
    caracteristicasAdicionales: string[],
    isActive: boolean,
    createdAt: Date,
    updatedAt: Date,
  ) {
    this._id = id;
    this._numeroHabitacion = numeroHabitacion;
    this._roomType = roomType;
    this._estado = estado;
    this._descripcion = descripcion;
    this._caracteristicasAdicionales = caracteristicasAdicionales;
    this._isActive = isActive;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
  }

  // Getters
  get id(): number {
    return this._id;
  }

  get numeroHabitacion(): string {
    return this._numeroHabitacion;
  }

  get roomType(): RoomType {
    return this._roomType;
  }

  get estado(): RoomStatus {
    return this._estado;
  }

  get capacidad(): number {
    return this._roomType.capacidadMaxima;
  }

  get precioPorNoche(): number {
    return this._roomType.precioPorNoche;
  }

  get descripcion(): string | null {
    return this._descripcion;
  }

  get caracteristicasAdicionales(): string[] {
    return [...this._caracteristicasAdicionales];
  }

  get caracteristicasCompletas(): string[] {
    const caracteristicasDelTipo = this._roomType.caracteristicas.map(
      (car) => car.nombre,
    );
    return [...caracteristicasDelTipo, ...this._caracteristicasAdicionales];
  }

  get isActive(): boolean {
    return this._isActive;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  // Métodos de negocio

  /**
   * Factory method para crear una nueva habitación
   */
  static create(
    numeroHabitacion: string,
    roomType: RoomType,
    descripcion: string | null = null,
    caracteristicasAdicionales: string[] = [],
  ): Room {
    // Validaciones
    if (!numeroHabitacion || numeroHabitacion.trim().length === 0) {
      throw new Error('Número de habitación es requerido');
    }

    if (!roomType || !roomType.isActive) {
      throw new Error('El tipo de habitación es requerido y debe estar activo');
    }

    const now = new Date();
    return new Room(
      0,
      numeroHabitacion.trim().toUpperCase(),
      roomType,
      RoomStatus.AVAILABLE,
      descripcion?.trim() || null,
      caracteristicasAdicionales,
      true,
      now,
      now,
    );
  }

  /**
   * Verificar si la habitación está disponible para reservar
   */
  isAvailable(): boolean {
    return this._isActive && this._estado === RoomStatus.AVAILABLE;
  }

  /**
   * Cambiar estado de la habitación
   */
  changeStatus(newStatus: RoomStatus): void {
    if (!this._isActive && newStatus !== RoomStatus.OUT_OF_SERVICE) {
      throw new Error(
        'No se puede cambiar el estado de una habitación inactiva',
      );
    }

    this._estado = newStatus;
    this._updatedAt = new Date();
  }

  /**
   * Marcar habitación como ocupada
   */
  markAsOccupied(): void {
    if (!this.isAvailable()) {
      throw new Error('La habitación no está disponible');
    }

    this._estado = RoomStatus.OCCUPIED;
    this._updatedAt = new Date();
  }

  /**
   * Marcar habitación como disponible
   */
  markAsAvailable(): void {
    if (!this._isActive) {
      throw new Error(
        'No se puede marcar como disponible una habitación inactiva',
      );
    }

    this._estado = RoomStatus.AVAILABLE;
    this._updatedAt = new Date();
  }

  /**
   * Poner habitación en mantenimiento
   */
  putInMaintenance(): void {
    if (this._estado === RoomStatus.OCCUPIED) {
      throw new Error(
        'No se puede poner en mantenimiento una habitación ocupada',
      );
    }

    this._estado = RoomStatus.MAINTENANCE;
    this._updatedAt = new Date();
  }

  /**
   * Actualizar información de la habitación
   */
  update(
    descripcion?: string | null,
    caracteristicasAdicionales?: string[],
  ): void {
    if (descripcion !== undefined) {
      this._descripcion = descripcion?.trim() || null;
    }

    if (caracteristicasAdicionales !== undefined) {
      this._caracteristicasAdicionales = caracteristicasAdicionales;
    }

    this._updatedAt = new Date();
  }

  /**
   * Desactivar habitación (soft delete)
   */
  deactivate(): void {
    if (this._estado === RoomStatus.OCCUPIED) {
      throw new Error('No se puede desactivar una habitación ocupada');
    }

    this._isActive = false;
    this._estado = RoomStatus.OUT_OF_SERVICE;
    this._updatedAt = new Date();
  }

  /**
   * Activar habitación
   */
  activate(): void {
    this._isActive = true;
    this._estado = RoomStatus.AVAILABLE;
    this._updatedAt = new Date();
  }

  /**
   * Calcular precio total para una cantidad de noches
   */
  calculateTotalPrice(nights: number): number {
    if (nights < 1) {
      throw new Error('Cantidad de noches debe ser al menos 1');
    }

    return this._roomType.calculateTotalPrice(nights);
  }
}
