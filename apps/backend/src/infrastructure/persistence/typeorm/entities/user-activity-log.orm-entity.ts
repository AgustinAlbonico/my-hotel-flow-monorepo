/**
 * UserActivityLog ORM Entity
 * Entidad TypeORM para registrar actividad de usuario
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { UserOrmEntity } from './user.orm-entity';
import { UserSessionOrmEntity } from './user-session.orm-entity';

@Entity('user_activity_log')
@Index(['userId'])
@Index(['sessionId'])
@Index(['activityAt'])
export class UserActivityLogOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  sessionId: string | null;

  @Column()
  userId: number;

  @Column({ type: 'varchar', length: 50 })
  activityType: string;

  @Column({ type: 'text', nullable: true })
  activityDescription: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  endpoint: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  httpMethod: string | null;

  @Column({ type: 'jsonb', nullable: true })
  requestParams: any | null;

  @Column({ type: 'integer', nullable: true })
  responseStatus: number | null;

  @Column({ type: 'integer', nullable: true })
  responseTimeMs: number | null;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ipAddress: string | null;

  @Column({ type: 'text', nullable: true })
  userAgent: string | null;

  @CreateDateColumn()
  activityAt: Date;

  @ManyToOne(() => UserOrmEntity)
  @JoinColumn({ name: 'userId' })
  user: UserOrmEntity;

  @ManyToOne(() => UserSessionOrmEntity, { nullable: true })
  @JoinColumn({ name: 'sessionId' })
  session: UserSessionOrmEntity | null;
}
