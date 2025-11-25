import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { ReservationOrmEntity } from './reservation.orm-entity';
import { ClientOrmEntity } from './client.orm-entity';
import { PaymentOrmEntity } from './payment.orm-entity';

@Entity('invoices')
@Index(['invoiceNumber'], { unique: true })
@Index(['reservationId'])
@Index(['clientId'])
@Index(['status'])
export class InvoiceOrmEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'reservation_id', type: 'int' })
  reservationId: number;

  @Column({ name: 'client_id', type: 'int' })
  clientId: number;

  @Column({ name: 'invoice_number', type: 'varchar', length: 50, unique: true })
  invoiceNumber: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal: number;

  @Column({ name: 'tax_rate', type: 'decimal', precision: 5, scale: 2 })
  taxRate: number;

  @Column({ name: 'tax_amount', type: 'decimal', precision: 10, scale: 2 })
  taxAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total: number;

  @Column({
    name: 'amount_paid',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  amountPaid: number;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'PENDING',
  })
  status: string;

  @Column({ name: 'issued_at', type: 'timestamp' })
  issuedAt: Date;

  @Column({ name: 'due_date', type: 'timestamp' })
  dueDate: Date;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relaciones
  @ManyToOne(() => ReservationOrmEntity, { eager: false })
  @JoinColumn({ name: 'reservation_id' })
  reservation: ReservationOrmEntity;

  @ManyToOne(() => ClientOrmEntity, { eager: false })
  @JoinColumn({ name: 'client_id' })
  client: ClientOrmEntity;

  @OneToMany(() => PaymentOrmEntity, (payment) => payment.invoice, {
    cascade: true,
  })
  payments: PaymentOrmEntity[];
}
