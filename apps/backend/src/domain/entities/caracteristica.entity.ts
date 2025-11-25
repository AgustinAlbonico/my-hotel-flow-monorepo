/**
 * Caracteristica Domain Entity
 * Patrón: Domain Entity - Clean Architecture
 * Capa: Domain
 * Responsabilidad: Representar características/amenidades de habitaciones
 */
export class Caracteristica {
  private readonly _id: number;
  private _nombre: string;
  private _descripcion: string | null;
  private _isActive: boolean;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  constructor(
    id: number,
    nombre: string,
    descripcion: string | null,
    isActive: boolean,
    createdAt: Date,
    updatedAt: Date,
  ) {
    this._id = id;
    this._nombre = nombre;
    this._descripcion = descripcion;
    this._isActive = isActive;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
  }

  // Getters
  get id(): number {
    return this._id;
  }

  get nombre(): string {
    return this._nombre;
  }

  get descripcion(): string | null {
    return this._descripcion;
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

  /**
   * Factory method para crear una nueva característica
   */
  static create(
    nombre: string,
    descripcion: string | null = null,
  ): Caracteristica {
    // Validaciones
    if (!nombre || nombre.trim().length === 0) {
      throw new Error('Nombre de característica es requerido');
    }

    if (nombre.trim().length < 3 || nombre.trim().length > 100) {
      throw new Error('Nombre debe tener entre 3 y 100 caracteres');
    }

    if (descripcion && descripcion.trim().length > 500) {
      throw new Error('Descripción no puede exceder 500 caracteres');
    }

    const now = new Date();
    return new Caracteristica(
      0,
      nombre.trim(),
      descripcion?.trim() || null,
      true,
      now,
      now,
    );
  }

  /**
   * Actualizar información
   */
  update(nombre?: string, descripcion?: string | null): void {
    if (nombre !== undefined) {
      if (!nombre || nombre.trim().length === 0) {
        throw new Error('Nombre de característica es requerido');
      }

      if (nombre.trim().length < 3 || nombre.trim().length > 100) {
        throw new Error('Nombre debe tener entre 3 y 100 caracteres');
      }

      this._nombre = nombre.trim();
    }

    if (descripcion !== undefined) {
      if (descripcion && descripcion.trim().length > 500) {
        throw new Error('Descripción no puede exceder 500 caracteres');
      }

      this._descripcion = descripcion?.trim() || null;
    }

    this._updatedAt = new Date();
  }

  /**
   * Activar característica
   */
  activate(): void {
    this._isActive = true;
    this._updatedAt = new Date();
  }

  /**
   * Desactivar característica
   */
  deactivate(): void {
    this._isActive = false;
    this._updatedAt = new Date();
  }

  /**
   * Reconstruir desde persistencia
   */
  static reconstruct(data: {
    id: number;
    nombre: string;
    descripcion: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): Caracteristica {
    return new Caracteristica(
      data.id,
      data.nombre,
      data.descripcion,
      data.isActive,
      data.createdAt,
      data.updatedAt,
    );
  }
}
