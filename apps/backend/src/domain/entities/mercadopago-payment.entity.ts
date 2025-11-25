/**
 * MercadoPago Payment Entity
 * Representa un pago procesado a través de MercadoPago
 */

export enum MercadoPagoPaymentStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  AUTHORIZED = 'authorized',
  IN_PROCESS = 'in_process',
  IN_MEDIATION = 'in_mediation',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  CHARGED_BACK = 'charged_back',
}

export enum MercadoPagoPaymentType {
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  TICKET = 'ticket',
  ATM = 'atm',
  DIGITAL_WALLET = 'digital_wallet',
}

export class MercadoPagoPayment {
  constructor(
    public readonly id: number,
    public readonly invoiceId: number,
    public readonly clientId: number,
    public readonly preferenceId: string,
    public readonly externalPaymentId: string | null,
    public readonly status: MercadoPagoPaymentStatus,
    public readonly paymentType: MercadoPagoPaymentType | null,
    public readonly amount: number,
    public readonly statusDetail: string | null,
    public readonly paymentMethodId: string | null,
    public readonly payerEmail: string | null,
    public readonly metadata: Record<string, any>,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  /**
   * Factory method para crear un nuevo pago de MercadoPago
   */
  static create(
    invoiceId: number,
    clientId: number,
    preferenceId: string,
    amount: number,
  ): MercadoPagoPayment {
    return new MercadoPagoPayment(
      0, // ID será asignado por la DB
      invoiceId,
      clientId,
      preferenceId,
      null, // Sin external payment ID aún
      MercadoPagoPaymentStatus.PENDING,
      null, // Tipo de pago se conocerá después
      amount,
      null, // Sin detalle de estado aún
      null, // Sin método de pago aún
      null, // Sin email del pagador aún
      {}, // Metadata vacío
      new Date(),
      new Date(),
    );
  }

  /**
   * Actualizar con información de webhook de MercadoPago
   */
  updateFromWebhook(
    externalPaymentId: string,
    status: MercadoPagoPaymentStatus,
    statusDetail: string | null,
    paymentType: MercadoPagoPaymentType | null,
    paymentMethodId: string | null,
    payerEmail: string | null,
    metadata: Record<string, any>,
  ): MercadoPagoPayment {
    return new MercadoPagoPayment(
      this.id,
      this.invoiceId,
      this.clientId,
      this.preferenceId,
      externalPaymentId,
      status,
      paymentType,
      this.amount,
      statusDetail,
      paymentMethodId,
      payerEmail,
      { ...this.metadata, ...metadata },
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Verificar si el pago está aprobado
   */
  isApproved(): boolean {
    return (
      this.status === MercadoPagoPaymentStatus.APPROVED ||
      this.status === MercadoPagoPaymentStatus.AUTHORIZED
    );
  }

  /**
   * Verificar si el pago está pendiente
   */
  isPending(): boolean {
    return (
      this.status === MercadoPagoPaymentStatus.PENDING ||
      this.status === MercadoPagoPaymentStatus.IN_PROCESS
    );
  }

  /**
   * Verificar si el pago falló
   */
  isFailed(): boolean {
    return (
      this.status === MercadoPagoPaymentStatus.REJECTED ||
      this.status === MercadoPagoPaymentStatus.CANCELLED
    );
  }

  /**
   * Verificar si fue reembolsado
   */
  isRefunded(): boolean {
    return (
      this.status === MercadoPagoPaymentStatus.REFUNDED ||
      this.status === MercadoPagoPaymentStatus.CHARGED_BACK
    );
  }
}
