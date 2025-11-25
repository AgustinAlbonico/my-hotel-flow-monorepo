import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToMany,
} from 'typeorm';
import { RoomTypeOrmEntity } from './room-type.orm-entity';

/**
 * CaracteristicaOrmEntity
 * Patrón: ORM Entity - TypeORM
 * Capa: Infrastructure
 * Responsabilidad: Mapeo de Caracteristica a tabla de base de datos
 */
@Entity('caracteristicas')
export class CaracteristicaOrmEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100, unique: true })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string | null;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date | null;

  // Relación Many-to-Many con RoomType
  @ManyToMany(() => RoomTypeOrmEntity, (roomType) => roomType.caracteristicas)
  roomTypes: RoomTypeOrmEntity[];
}
