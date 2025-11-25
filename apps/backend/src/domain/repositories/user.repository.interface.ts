/**
 * User Repository Interface
 * Contrato para la persistencia de usuarios
 */

import type { User } from '../entities/user.entity';
import type { Email } from '../value-objects/email.vo';

export interface IUserRepository {
  /**
   * Obtiene todos los usuarios
   */
  findAll(): Promise<User[]>;

  /**
   * Busca un usuario por ID
   */
  findById(id: number): Promise<User | null>;

  /**
   * Busca un usuario por username
   */
  findByUsername(username: string): Promise<User | null>;

  /**
   * Busca un usuario por email
   */
  findByEmail(email: Email): Promise<User | null>;

  /**
   * Busca un usuario por token de recuperación de contraseña
   */
  findByPasswordResetToken(token: string): Promise<User | null>;

  /**
   * Busca un usuario por ID incluyendo sus relaciones
   * @param includeGroups - Si debe cargar los grupos
   * @param includeActions - Si debe cargar las acciones directas
   */
  findByIdWithRelations(
    id: number,
    includeGroups?: boolean,
    includeActions?: boolean,
  ): Promise<User | null>;

  /**
   * Busca un usuario por username incluyendo sus relaciones
   */
  findByUsernameWithRelations(
    username: string,
    includeGroups?: boolean,
    includeActions?: boolean,
  ): Promise<User | null>;

  /**
   * Guarda un usuario (crear o actualizar)
   */
  save(user: User): Promise<User>;

  /**
   * Actualiza solo información de login sin tocar relaciones
   * Evita que se borren groups/actions al guardar después del login
   */
  updateLoginInfo(
    userId: number,
    lastLoginAt: Date | undefined,
    failedLoginAttempts: number,
    lockedUntil: Date | undefined,
  ): Promise<void>;

  /**
   * Elimina un usuario
   */
  delete(id: number): Promise<void>;
}
