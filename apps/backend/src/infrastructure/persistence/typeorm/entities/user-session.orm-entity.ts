/**
 * UserSession ORM Entity
 * Entidad TypeORM para registrar sesiones de usuario (login/logout)
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { UserOrmEntity } from './user.orm-entity';

export enum LogoutType {
  MANUAL = 'MANUAL',
  AUTO = 'AUTO',
  EXPIRED = 'EXPIRED',
  FORCED = 'FORCED',
}

@Entity('user_sessions')
@Index(['userId'])
@Index(['loginAt'])
@Index(['isActive'])
export class UserSessionOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: number;

  @Column({ type: 'varchar', length: 100 })
  username: string;

  @Column({ type: 'timestamp' })
  loginAt: Date;

  @Column({ type: 'varchar', length: 45, nullable: true })
  loginIp: string | null;

  @Column({ type: 'text', nullable: true })
  loginUserAgent: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  loginLocation: string | null;

  @Column({ type: 'timestamp', nullable: true })
  logoutAt: Date | null;

  @Column({
    type: 'enum',
    enum: LogoutType,
    nullable: true,
  })
  logoutType: LogoutType | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  sessionToken: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  refreshToken: string | null;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date | null;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @ManyToOne(() => UserOrmEntity)
  @JoinColumn({ name: 'userId' })
  user: UserOrmEntity;
}
