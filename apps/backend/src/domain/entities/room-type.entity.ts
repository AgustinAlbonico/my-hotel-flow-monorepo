import { Caracteristica } from './caracteristica.entity';

/**
 * RoomType Domain Entity
 * Patrón: Domain Entity - Clean Architecture
 * Capa: Domain
 * Responsabilidad: Representar tipos de habitación con sus características y precios
 */
export class RoomType {
  private readonly _id: number;
  private _code: string; // Código único del tipo (ej: "estandar", "suite-deluxe", "familiar")
  private _name: string; // Nombre descriptivo
  private _precioPorNoche: number;
  private _capacidadMaxima: number;
  private _descripcion: string | null;
  private _caracteristicas: Caracteristica[];
  private _isActive: boolean;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  constructor(
    id: number,
    code: string,
    name: string,
    precioPorNoche: number,
    capacidadMaxima: number,
    descripcion: string | null,
    caracteristicas: Caracteristica[],
    isActive: boolean,
    createdAt: Date,
    updatedAt: Date,
  ) {
    this._id = id;
    this._code = code;
    this._name = name;
    this._precioPorNoche = precioPorNoche;
    this._capacidadMaxima = capacidadMaxima;
    this._descripcion = descripcion;
    this._caracteristicas = caracteristicas;
    this._isActive = isActive;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
  }

  // Getters
  get id(): number {
    return this._id;
  }

  get code(): string {
    return this._code;
  }

  get name(): string {
    return this._name;
  }

  get precioPorNoche(): number {
    return this._precioPorNoche;
  }

  get capacidadMaxima(): number {
    return this._capacidadMaxima;
  }

  get descripcion(): string | null {
    return this._descripcion;
  }

  get caracteristicas(): Caracteristica[] {
    return [...this._caracteristicas];
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
   * Factory method para crear un nuevo tipo de habitación
   */
  static create(
    code: string,
    name: string,
    precioPorNoche: number,
    capacidadMaxima: number,
    descripcion: string | null = null,
    caracteristicas: Caracteristica[] = [],
  ): RoomType {
    // Validaciones
    if (!code || code.trim().length === 0) {
      throw new Error('Código de tipo de habitación es requerido');
    }

    // Validar formato del código: solo minúsculas, números y guiones
    const codeRegex = /^[a-z0-9-]+$/;
    if (!codeRegex.test(code.trim())) {
      throw new Error(
        'Código debe contener solo letras minúsculas, números y guiones',
      );
    }

    if (code.trim().length < 2 || code.trim().length > 50) {
      throw new Error('Código debe tener entre 2 y 50 caracteres');
    }

    if (!name || name.trim().length === 0) {
      throw new Error('Nombre de tipo de habitación es requerido');
    }

    if (precioPorNoche <= 0) {
      throw new Error('Precio por noche debe ser mayor a 0');
    }

    if (capacidadMaxima < 1 || capacidadMaxima > 10) {
      throw new Error('Capacidad máxima debe estar entre 1 y 10 personas');
    }

    const now = new Date();
    return new RoomType(
      0,
      code.trim().toLowerCase(),
      name.trim(),
      precioPorNoche,
      capacidadMaxima,
      descripcion?.trim() || null,
      caracteristicas,
      true,
      now,
      now,
    );
  }

  /**
   * Actualizar precio por noche
   */
  updatePrice(newPrice: number): void {
    if (newPrice <= 0) {
      throw new Error('Precio debe ser mayor a 0');
    }

    this._precioPorNoche = newPrice;
    this._updatedAt = new Date();
  }

  /**
   * Actualizar información del tipo de habitación
   */
  update(
    name?: string,
    capacidadMaxima?: number,
    descripcion?: string | null,
    caracteristicas?: Caracteristica[],
  ): void {
    if (name !== undefined) {
      if (!name || name.trim().length === 0) {
        throw new Error('Nombre no puede estar vacío');
      }
      this._name = name.trim();
    }

    if (capacidadMaxima !== undefined) {
      if (capacidadMaxima < 1 || capacidadMaxima > 10) {
        throw new Error('Capacidad máxima debe estar entre 1 y 10 personas');
      }
      this._capacidadMaxima = capacidadMaxima;
    }

    if (descripcion !== undefined) {
      this._descripcion = descripcion?.trim() || null;
    }

    if (caracteristicas !== undefined) {
      this._caracteristicas = caracteristicas;
    }

    this._updatedAt = new Date();
  }

  /**
   * Desactivar tipo de habitación
   */
  deactivate(): void {
    this._isActive = false;
    this._updatedAt = new Date();
  }

  /**
   * Activar tipo de habitación
   */
  activate(): void {
    this._isActive = true;
    this._updatedAt = new Date();
  }

  /**
   * Calcular precio total para una cantidad de noches
   */
  calculateTotalPrice(nights: number): number {
    if (nights < 1) {
      throw new Error('Cantidad de noches debe ser al menos 1');
    }

    return this._precioPorNoche * nights;
  }

  /**
   * Reconstruir desde persistencia
   */
  static reconstruct(data: {
    id: number;
    code: string;
    name: string;
    precioPorNoche: number;
    capacidadMaxima: number;
    descripcion: string | null;
    caracteristicas: Caracteristica[];
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): RoomType {
    return new RoomType(
      data.id,
      data.code,
      data.name,
      data.precioPorNoche,
      data.capacidadMaxima,
      data.descripcion,
      data.caracteristicas,
      data.isActive,
      data.createdAt,
      data.updatedAt,
    );
  }
}
