/**
 * Group Repository Interface
 * Contrato para la persistencia de grupos
 */

import type { Group } from '../entities/group.entity';

export interface IGroupRepository {
  /**
   * Obtiene todos los grupos
   */
  findAll(): Promise<Group[]>;

  /**
   * Busca un grupo por ID
   */
  findById(id: number): Promise<Group | null>;

  /**
   * Busca un grupo por key
   */
  findByKey(key: string): Promise<Group | null>;

  /**
   * Busca un grupo por ID incluyendo sus relaciones
   * @param includeActions - Si debe cargar las acciones
   * @param includeChildren - Si debe cargar los grupos hijos
   */
  findByIdWithRelations(
    id: number,
    includeActions?: boolean,
    includeChildren?: boolean,
  ): Promise<Group | null>;

  /**
   * Guarda un grupo (crear o actualizar)
   */
  save(group: Group): Promise<Group>;

  /**
   * Elimina un grupo
   */
  delete(id: number): Promise<void>;
}
