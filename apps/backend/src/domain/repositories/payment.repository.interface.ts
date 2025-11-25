import type { Payment } from '../entities/payment.entity';

export interface IPaymentRepository {
  findById(id: number): Promise<Payment | null>;
  findByInvoiceId(invoiceId: number): Promise<Payment[]>;
  findByClientId(clientId: number): Promise<Payment[]>;
  findByReference(reference: string): Promise<Payment | null>;
  /** Buscar por id de preferencia de MercadoPago almacenado en el pago unificado */
  findByMpPreferenceId(mpPreferenceId: string): Promise<Payment | null>;
  /** Buscar por id de pago externo de MercadoPago almacenado en el pago unificado */
  findByMpExternalPaymentId(
    mpExternalPaymentId: string,
  ): Promise<Payment | null>;
  save(payment: Payment): Promise<Payment>;
  update(payment: Payment): Promise<Payment>;
  delete(id: number): Promise<void>;
}
