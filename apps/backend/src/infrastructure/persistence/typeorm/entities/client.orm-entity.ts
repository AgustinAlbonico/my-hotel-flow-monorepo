import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('clients')
@Index(['dni'], { where: 'is_active = true' })
@Index(['email'], { where: 'is_active = true' })
export class ClientOrmEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 8, unique: true })
  dni: string;

  @Column({ name: 'first_name', length: 100 })
  firstName: string;

  @Column({ name: 'last_name', length: 100 })
  lastName: string;

  @Column({ length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 15, nullable: true })
  phone: string | null;

  @Column({ type: 'date', name: 'birth_date', nullable: true })
  birthDate: Date | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  address: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  country: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  nationality: string | null;

  @Column({ type: 'text', nullable: true })
  observations: string | null;

  @Column({ length: 255 })
  password: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({
    name: 'outstanding_balance',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  outstandingBalance: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
