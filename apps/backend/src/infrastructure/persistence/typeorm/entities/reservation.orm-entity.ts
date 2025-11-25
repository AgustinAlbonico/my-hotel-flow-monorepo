/**
 * Reservation ORM Entity
 * Entidad TypeORM para persistir reservas en la base de datos
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  VersionColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ClientOrmEntity } from './client.orm-entity';
import { RoomOrmEntity } from './room.orm-entity';

@Entity('reservations')
export class ReservationOrmEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 50 })
  code: string;

  @Column()
  clientId: number;

  @Column()
  roomId: number;

  @Column({ type: 'date' })
  checkIn: Date;

  @Column({ type: 'date' })
  checkOut: Date;

  @Column({
    type: 'enum',
    enum: ['CONFIRMED', 'IN_PROGRESS', 'CANCELLED', 'COMPLETED'],
    default: 'CONFIRMED',
  })
  status: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  cancelReason: string | null;

  @VersionColumn()
  version: number;

  @Column({ type: 'varchar', length: 255, nullable: true, unique: true })
  idempotencyKey: string | null;

  @Column({ type: 'jsonb', nullable: true })
  checkInData: any | null;

  @Column({ type: 'jsonb', nullable: true })
  checkOutData: any | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => ClientOrmEntity, { eager: true })
  @JoinColumn({ name: 'clientId' })
  client: ClientOrmEntity;

  @ManyToOne(() => RoomOrmEntity, (room) => room.reservations, { eager: true })
  @JoinColumn({ name: 'roomId' })
  room: RoomOrmEntity;
}
