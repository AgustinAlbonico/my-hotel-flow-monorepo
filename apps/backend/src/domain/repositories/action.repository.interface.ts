/**
 * Action Repository Interface
 * Define el contrato para el repositorio de Actions
 * Esta interfaz pertenece al dominio y es implementada en la capa de infraestructura
 */

import { Action } from '../entities/action.entity';

export interface IActionRepository {
  /**
   * Obtener todas las actions
   */
  findAll(): Promise<Action[]>;

  /**
   * Buscar action por ID
   */
  findById(id: number): Promise<Action | null>;

  /**
   * Buscar action por key
   */
  findByKey(key: string): Promise<Action | null>;

  /**
   * Buscar múltiples actions por sus keys
   */
  findByKeys(keys: string[]): Promise<Action[]>;

  /**
   * Guardar (crear o actualizar) una action
   */
  save(action: Action): Promise<Action>;

  /**
   * Eliminar una action por ID
   */
  delete(id: number): Promise<void>;

  /**
   * Verificar si existe una action con una key específica
   */
  existsByKey(key: string): Promise<boolean>;
}
