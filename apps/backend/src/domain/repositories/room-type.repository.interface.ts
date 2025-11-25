import { RoomType } from '../entities/room-type.entity';

/**
 * IRoomTypeRepository
 * Patrón: Repository Interface - Clean Architecture
 * Capa: Domain
 * Responsabilidad: Definir el contrato para persistencia de tipos de habitación
 */
export interface IRoomTypeRepository {
  /**
   * Buscar tipo de habitación por ID
   */
  findById(id: number): Promise<RoomType | null>;

  /**
   * Buscar tipo de habitación por código
   */
  findByCode(code: string): Promise<RoomType | null>;

  /**
   * Obtener todos los tipos de habitación activos
   */
  findAllActive(): Promise<RoomType[]>;

  /**
   * Obtener todos los tipos de habitación (incluidos inactivos)
   */
  findAll(): Promise<RoomType[]>;

  /**
   * Guardar un nuevo tipo de habitación
   */
  save(roomType: RoomType): Promise<RoomType>;

  /**
   * Actualizar un tipo de habitación existente
   */
  update(roomType: RoomType): Promise<RoomType>;

  /**
   * Eliminar un tipo de habitación (soft delete)
   */
  delete(id: number): Promise<void>;

  /**
   * Verificar si existe un tipo de habitación por código
   */
  existsByCode(code: string): Promise<boolean>;
}
