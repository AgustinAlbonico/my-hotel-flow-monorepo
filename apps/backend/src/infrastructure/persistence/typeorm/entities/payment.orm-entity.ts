import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { InvoiceOrmEntity } from './invoice.orm-entity';
import { ClientOrmEntity } from './client.orm-entity';

@Entity('payments')
@Index(['invoiceId'])
@Index(['clientId'])
@Index(['status'])
@Index(['paidAt'])
export class PaymentOrmEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'invoice_id', type: 'int' })
  invoiceId: number;

  @Column({ name: 'client_id', type: 'int' })
  clientId: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 20 })
  method: string;

  @Column({ type: 'varchar', length: 20, default: 'PENDING' })
  status: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  reference: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ name: 'paid_at', type: 'timestamp' })
  paidAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // --- Campos opcionales para integración con MercadoPago (unificación de tabla) ---
  @Index({ unique: true, where: 'mp_preference_id IS NOT NULL' })
  @Column({ name: 'mp_preference_id', type: 'varchar', nullable: true })
  mpPreferenceId: string | null;

  @Index({ unique: true, where: 'mp_external_payment_id IS NOT NULL' })
  @Column({ name: 'mp_external_payment_id', type: 'varchar', nullable: true })
  mpExternalPaymentId: string | null;

  @Column({ name: 'mp_status', type: 'varchar', length: 50, nullable: true })
  mpStatus: string | null;

  @Column({ name: 'mp_status_detail', type: 'varchar', nullable: true })
  mpStatusDetail: string | null;

  @Column({
    name: 'mp_payment_type',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  mpPaymentType: string | null;

  @Column({ name: 'mp_payment_method_id', type: 'varchar', nullable: true })
  mpPaymentMethodId: string | null;

  @Column({ name: 'mp_payer_email', type: 'varchar', nullable: true })
  mpPayerEmail: string | null;

  @Column({ name: 'mp_metadata', type: 'jsonb', default: {} })
  mpMetadata: Record<string, any>;

  // Relaciones
  @ManyToOne(() => InvoiceOrmEntity, (invoice) => invoice.payments, {
    eager: false,
  })
  @JoinColumn({ name: 'invoice_id' })
  invoice: InvoiceOrmEntity;

  @ManyToOne(() => ClientOrmEntity, { eager: false })
  @JoinColumn({ name: 'client_id' })
  client: ClientOrmEntity;
}
