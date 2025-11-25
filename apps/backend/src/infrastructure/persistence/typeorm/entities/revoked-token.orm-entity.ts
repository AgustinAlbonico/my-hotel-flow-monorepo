import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

/**
 * Entidad RevokedToken - Blacklist de tokens JWT revocados
 * Patrón: Blacklist Strategy
 * Se usa para invalidar tokens antes de su expiración natural (logout, cambio de contraseña, etc.)
 */
@Entity('revoked_token')
@Index(['jti', 'expiresAt'])
export class RevokedTokenEntity {
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * JWT ID (jti claim) - Identificador único del token
   */
  @Column({ unique: true, length: 36 })
  jti: string;

  /**
   * ID del usuario al que pertenecía el token
   */
  @Column()
  userId: number;

  /**
   * Tipo de token revocado
   * 'access' | 'refresh'
   */
  @Column({ length: 20 })
  tokenType: string;

  /**
   * Razón de la revocación
   * Ejemplos: 'logout', 'password_change', 'admin_revoke', 'token_rotation'
   */
  @Column({ length: 50 })
  reason: string;

  /**
   * Fecha de expiración del token original
   * Permite limpiar tokens viejos de la blacklist
   */
  @Column({ type: 'timestamp' })
  expiresAt: Date;

  /**
   * IP desde donde se realizó la revocación
   */
  @Column({ length: 50, nullable: true })
  ip?: string;

  @CreateDateColumn()
  createdAt: Date;
}
