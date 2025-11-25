import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { InvoiceOrmEntity } from './invoice.orm-entity';
import { ClientOrmEntity } from './client.orm-entity';

/**
 * MercadoPago Payment ORM Entity
 */
@Entity('mercadopago_payments')
@Index(['preferenceId'], { unique: true })
@Index(['externalPaymentId'], {
  unique: true,
  where: 'external_payment_id IS NOT NULL',
})
@Index(['invoiceId'])
@Index(['clientId'])
@Index(['status'])
export class MercadoPagoPaymentOrmEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'invoice_id' })
  invoiceId: number;

  @Column({ name: 'client_id' })
  clientId: number;

  @Column({ name: 'preference_id', unique: true })
  preferenceId: string;

  @Column({
    name: 'external_payment_id',
    type: 'varchar',
    nullable: true,
    unique: true,
  })
  externalPaymentId: string | null;

  @Column({
    type: 'enum',
    enum: [
      'pending',
      'approved',
      'authorized',
      'in_process',
      'in_mediation',
      'rejected',
      'cancelled',
      'refunded',
      'charged_back',
    ],
    default: 'pending',
  })
  status: string;

  @Column({
    name: 'payment_type',
    type: 'enum',
    enum: ['credit_card', 'debit_card', 'ticket', 'atm', 'digital_wallet'],
    nullable: true,
  })
  paymentType: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ name: 'status_detail', type: 'varchar', nullable: true })
  statusDetail: string | null;

  @Column({ name: 'payment_method_id', type: 'varchar', nullable: true })
  paymentMethodId: string | null;

  @Column({ name: 'payer_email', type: 'varchar', nullable: true })
  payerEmail: string | null;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relaciones
  @ManyToOne(() => InvoiceOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'invoice_id' })
  invoice: InvoiceOrmEntity;

  @ManyToOne(() => ClientOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'client_id' })
  client: ClientOrmEntity;
}
