/**
 * MercadoPago Payment Repository Interface
 */
import { MercadoPagoPayment } from '../entities/mercadopago-payment.entity';

export interface IMercadoPagoPaymentRepository {
  /**
   * Guardar un pago de MercadoPago
   */
  save(payment: MercadoPagoPayment): Promise<MercadoPagoPayment>;

  /**
   * Actualizar un pago de MercadoPago
   */
  update(payment: MercadoPagoPayment): Promise<void>;

  /**
   * Buscar por ID
   */
  findById(id: number): Promise<MercadoPagoPayment | null>;

  /**
   * Buscar por preference ID
   */
  findByPreferenceId(preferenceId: string): Promise<MercadoPagoPayment | null>;

  /**
   * Buscar por external payment ID (ID de MercadoPago)
   */
  findByExternalPaymentId(
    externalPaymentId: string,
  ): Promise<MercadoPagoPayment | null>;

  /**
   * Buscar todos los pagos de una factura
   */
  findByInvoiceId(invoiceId: number): Promise<MercadoPagoPayment[]>;

  /**
   * Buscar todos los pagos de un cliente
   */
  findByClientId(clientId: number): Promise<MercadoPagoPayment[]>;
}
