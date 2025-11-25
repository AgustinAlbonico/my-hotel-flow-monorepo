import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { CaracteristicaOrmEntity } from './caracteristica.orm-entity';

/**
 * RoomTypeOrmEntity
 * Patrón: ORM Entity - Clean Architecture
 * Capa: Infrastructure
 * Responsabilidad: Mapeo objeto-relacional para tipos de habitación
 */
@Entity('room_types')
export class RoomTypeOrmEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  code!: string;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  precioPorNoche!: number;

  @Column({ type: 'int' })
  capacidadMaxima!: number;

  @Column({ type: 'text', nullable: true })
  descripcion!: string | null;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Relación Many-to-Many con Caracteristica
  @ManyToMany(
    () => CaracteristicaOrmEntity,
    (caracteristica) => caracteristica.roomTypes,
    {
      eager: true,
    },
  )
  @JoinTable({
    name: 'room_type_caracteristicas',
    joinColumn: { name: 'room_type_id', referencedColumnName: 'id' },
    inverseJoinColumn: {
      name: 'caracteristica_id',
      referencedColumnName: 'id',
    },
  })
  caracteristicas!: CaracteristicaOrmEntity[];
}
