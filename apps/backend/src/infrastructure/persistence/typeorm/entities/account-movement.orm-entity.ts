/**
 * Account Movement ORM Entity
 */
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ClientOrmEntity } from './client.orm-entity';

@Entity('account_movements')
@Index(['clientId', 'createdAt'])
@Index(['reference'])
export class AccountMovementOrmEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'client_id' })
  clientId: number;

  @ManyToOne(() => ClientOrmEntity)
  @JoinColumn({ name: 'client_id' })
  client: ClientOrmEntity;

  @Column({
    type: 'enum',
    enum: ['CHARGE', 'PAYMENT', 'ADJUSTMENT'],
  })
  type: 'CHARGE' | 'PAYMENT' | 'ADJUSTMENT';

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  balance: number;

  @Column({
    type: 'enum',
    enum: ['PENDING', 'COMPLETED', 'REVERSED'],
    default: 'COMPLETED',
  })
  status: 'PENDING' | 'COMPLETED' | 'REVERSED';

  @Column({ length: 100 })
  reference: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
