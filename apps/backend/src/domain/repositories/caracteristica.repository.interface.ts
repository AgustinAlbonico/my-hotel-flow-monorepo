import { Caracteristica } from '../entities/caracteristica.entity';

/**
 * ICaracteristicaRepository
 * Patrón: Repository Interface - Clean Architecture
 * Capa: Domain
 * Responsabilidad: Definir contrato de persisten   cia para características
 */
export interface ICaracteristicaRepository {
  /**
   * Buscar característica por ID
   */
  findById(id: number): Promise<Caracteristica | null>;

  /**
   * Buscar característica por nombre
   */
  findByNombre(nombre: string): Promise<Caracteristica | null>;

  /**
   * Obtener todas las características
   */
  findAll(): Promise<Caracteristica[]>;

  /**
   * Obtener características activas
   */
  findAllActive(): Promise<Caracteristica[]>;

  /**
   * Buscar características por IDs
   */
  findByIds(ids: number[]): Promise<Caracteristica[]>;

  /**
   * Guardar nueva característica
   */
  save(caracteristica: Caracteristica): Promise<Caracteristica>;

  /**
   * Actualizar característica existente
   */
  update(caracteristica: Caracteristica): Promise<Caracteristica>;

  /**
   * Eliminar característica (soft delete)
   */
  delete(id: number): Promise<void>;

  /**
   * Verificar si existe característica por nombre
   */
  existsByNombre(nombre: string): Promise<boolean>;
}

/**
 * ICaracteristicaRepository
 * Patrón: Repository Interface - Clean Architecture
 * Capa: Domain
 * Responsabilidad: Definir el contrato para persistencia de características
 */
export interface ICaracteristicaRepository {
  /**
   * Buscar característica por ID
   */
  findById(id: number): Promise<Caracteristica | null>;

  /**
   * Buscar característica por nombre
   */
  findByNombre(nombre: string): Promise<Caracteristica | null>;

  /**
   * Listar todas las características
   */
  findAll(): Promise<Caracteristica[]>;

  /**
   * Listar características activas
   */
  findAllActive(): Promise<Caracteristica[]>;

  /**
   * Crear una nueva característica
   */
  save(caracteristica: Caracteristica): Promise<Caracteristica>;

  /**
   * Actualizar una característica
   */
  update(caracteristica: Caracteristica): Promise<Caracteristica>;

  /**
   * Eliminar una característica (soft delete)
   */
  delete(id: number): Promise<void>;

  /**
   * Verificar si existe una característica por nombre
   */
  existsByNombre(nombre: string): Promise<boolean>;
}
