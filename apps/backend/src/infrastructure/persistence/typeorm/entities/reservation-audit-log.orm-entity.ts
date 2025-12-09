/**
 * ReservationAuditLog ORM Entity
 * Entidad TypeORM para registrar auditoría de cambios en reservas
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
import { ReservationOrmEntity } from './reservation.orm-entity';
import { UserOrmEntity } from './user.orm-entity';

export enum AuditActionType {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  STATUS_CHANGE = 'STATUS_CHANGE',
  DELETE = 'DELETE',
  MODIFY_DATES = 'MODIFY_DATES',
  MODIFY_AMOUNT = 'MODIFY_AMOUNT',
  CHECK_IN = 'CHECK_IN',
  CHECK_OUT = 'CHECK_OUT',
  CANCEL = 'CANCEL',
}

@Entity('reservation_audit_log')
@Index(['reservationId'])
@Index(['changedAt'])
@Index(['changedByUserId'])
export class ReservationAuditLogOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  reservationId: number;

  @Column({
    type: 'enum',
    enum: AuditActionType,
  })
  actionType: AuditActionType;

  @Column({ type: 'varchar', length: 100, nullable: true })
  fieldChanged: string | null;

  @Column({ type: 'text', nullable: true })
  oldValue: string | null;

  @Column({ type: 'text', nullable: true })
  newValue: string | null;

  @Column({ type: 'text', nullable: true })
  changeReason: string | null;

  @Column({ nullable: true })
  changedByUserId: number | null;

  @Column({ type: 'varchar', length: 100 })
  changedByUsername: string;

  @Column({ type: 'varchar', length: 50 })
  changedBySystem: string;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ipAddress: string | null;

  @Column({ type: 'text', nullable: true })
  userAgent: string | null;

  @CreateDateColumn()
  changedAt: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @ManyToOne(() => ReservationOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reservationId' })
  reservation: ReservationOrmEntity;

  @ManyToOne(() => UserOrmEntity, { nullable: true })
  @JoinColumn({ name: 'changedByUserId' })
  changedByUser: UserOrmEntity | null;
}
