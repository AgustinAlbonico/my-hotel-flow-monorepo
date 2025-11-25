/**
 * Room ORM Entity
 * Entidad TypeORM para persistir habitaciones en la base de datos
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ReservationOrmEntity } from './reservation.orm-entity';
import { RoomTypeOrmEntity } from './room-type.orm-entity';

@Entity('rooms')
export class RoomOrmEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 10 })
  numeroHabitacion: string;

  @Column()
  roomTypeId: number;

  @ManyToOne(() => RoomTypeOrmEntity, { eager: true })
  @JoinColumn({ name: 'roomTypeId' })
  roomType: RoomTypeOrmEntity;

  @Column({
    type: 'enum',
    enum: ['AVAILABLE', 'OCCUPIED', 'MAINTENANCE', 'OUT_OF_SERVICE'],
    default: 'AVAILABLE',
  })
  estado: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string | null;

  @Column({ type: 'simple-array', default: '' })
  caracteristicasAdicionales: string[];

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => ReservationOrmEntity, (reservation) => reservation.room)
  reservations: ReservationOrmEntity[];
}
