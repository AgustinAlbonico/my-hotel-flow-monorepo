/**
 * Payment Domain Entity
 * Representa un pago realizado contra una factura
 */

export enum PaymentMethod {
  CASH = 'CASH', // Efectivo
  CREDIT_CARD = 'CREDIT_CARD', // Tarjeta de crédito
  DEBIT_CARD = 'DEBIT_CARD', // Tarjeta de débito
  BANK_TRANSFER = 'BANK_TRANSFER', // Transferencia bancaria
  CHECK = 'CHECK', // Cheque
  OTHER = 'OTHER', // Otro
}

export enum PaymentStatus {
  PENDING = 'PENDING', // Pendiente de procesamiento
  COMPLETED = 'COMPLETED', // Completado exitosamente
  FAILED = 'FAILED', // Fallido
  REFUNDED = 'REFUNDED', // Reembolsado
}

export class Payment {
  private readonly _id: number;
  private readonly _invoiceId: number;
  private readonly _clientId: number;
  private _amount: number;
  private _method: PaymentMethod;
  private _status: PaymentStatus;
  private _reference: string | null; // Número de transacción, cheque, etc.
  private _notes: string | null;
  private readonly _paidAt: Date;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  // Campos opcionales para integración con pasarelas (MercadoPago)
  private _mpPreferenceId?: string | null;
  private _mpExternalPaymentId?: string | null;
  private _mpStatus?: string | null;
  private _mpStatusDetail?: string | null;
  private _mpPaymentType?: string | null;
  private _mpPaymentMethodId?: string | null;
  private _mpPayerEmail?: string | null;
  private _mpMetadata?: Record<string, unknown>;

  private constructor(data: {
    id: number;
    invoiceId: number;
    clientId: number;
    amount: number;
    method: PaymentMethod;
    status: PaymentStatus;
    reference: string | null;
    notes: string | null;
    paidAt: Date;
    createdAt: Date;
    updatedAt: Date;
    mpPreferenceId?: string | null;
    mpExternalPaymentId?: string | null;
    mpStatus?: string | null;
    mpStatusDetail?: string | null;
    mpPaymentType?: string | null;
    mpPaymentMethodId?: string | null;
    mpPayerEmail?: string | null;
    mpMetadata?: Record<string, unknown>;
  }) {
    this._id = data.id;
    this._invoiceId = data.invoiceId;
    this._clientId = data.clientId;
    this._amount = data.amount;
    this._method = data.method;
    this._status = data.status;
    this._reference = data.reference;
    this._notes = data.notes;
    this._paidAt = data.paidAt;
    this._createdAt = data.createdAt;
    this._updatedAt = data.updatedAt;
    this._mpPreferenceId = data.mpPreferenceId ?? null;
    this._mpExternalPaymentId = data.mpExternalPaymentId ?? null;
    this._mpStatus = data.mpStatus ?? null;
    this._mpStatusDetail = data.mpStatusDetail ?? null;
    this._mpPaymentType = data.mpPaymentType ?? null;
    this._mpPaymentMethodId = data.mpPaymentMethodId ?? null;
    this._mpPayerEmail = data.mpPayerEmail ?? null;
    this._mpMetadata = data.mpMetadata ?? {};
  }

  static create(
    invoiceId: number,
    clientId: number,
    amount: number,
    method: PaymentMethod,
    reference: string | null = null,
    notes: string | null = null,
  ): Payment {
    if (amount <= 0) {
      throw new Error('El monto del pago debe ser mayor a 0');
    }

    return new Payment({
      id: 0,
      invoiceId,
      clientId,
      amount,
      method,
      status: PaymentStatus.PENDING,
      reference,
      notes,
      paidAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static reconstruct(data: {
    id: number;
    invoiceId: number;
    clientId: number;
    amount: number;
    method: PaymentMethod;
    status: PaymentStatus;
    reference: string | null;
    notes: string | null;
    paidAt: Date;
    createdAt: Date;
    updatedAt: Date;
    mpPreferenceId?: string | null;
    mpExternalPaymentId?: string | null;
    mpStatus?: string | null;
    mpStatusDetail?: string | null;
    mpPaymentType?: string | null;
    mpPaymentMethodId?: string | null;
    mpPayerEmail?: string | null;
    mpMetadata?: Record<string, unknown>;
  }): Payment {
    return new Payment(data);
  }

  // Getters
  get id(): number {
    return this._id;
  }
  get invoiceId(): number {
    return this._invoiceId;
  }
  get clientId(): number {
    return this._clientId;
  }
  get amount(): number {
    return this._amount;
  }
  get method(): PaymentMethod {
    return this._method;
  }
  get status(): PaymentStatus {
    return this._status;
  }
  get reference(): string | null {
    return this._reference;
  }
  get notes(): string | null {
    return this._notes;
  }
  get paidAt(): Date {
    return this._paidAt;
  }
  get createdAt(): Date {
    return this._createdAt;
  }
  get updatedAt(): Date {
    return this._updatedAt;
  }

  // Getters MP opcionales
  get mpPreferenceId(): string | null | undefined {
    return this._mpPreferenceId;
  }
  get mpExternalPaymentId(): string | null | undefined {
    return this._mpExternalPaymentId;
  }
  get mpStatus(): string | null | undefined {
    return this._mpStatus;
  }
  get mpStatusDetail(): string | null | undefined {
    return this._mpStatusDetail;
  }
  get mpPaymentType(): string | null | undefined {
    return this._mpPaymentType;
  }
  get mpPaymentMethodId(): string | null | undefined {
    return this._mpPaymentMethodId;
  }
  get mpPayerEmail(): string | null | undefined {
    return this._mpPayerEmail;
  }
  get mpMetadata(): Record<string, unknown> | undefined {
    return this._mpMetadata;
  }

  /**
   * Marca el pago como completado
   */
  markAsCompleted(): void {
    if (this._status !== PaymentStatus.PENDING) {
      throw new Error('Solo se pueden completar pagos pendientes');
    }

    this._status = PaymentStatus.COMPLETED;
    this._updatedAt = new Date();
  }

  /**
   * Marca el pago como fallido
   */
  markAsFailed(): void {
    if (this._status !== PaymentStatus.PENDING) {
      throw new Error('Solo se pueden marcar como fallidos pagos pendientes');
    }

    this._status = PaymentStatus.FAILED;
    this._updatedAt = new Date();
  }

  /**
   * Marca el pago como reembolsado
   */
  markAsRefunded(): void {
    if (this._status !== PaymentStatus.COMPLETED) {
      throw new Error('Solo se pueden reembolsar pagos completados');
    }

    this._status = PaymentStatus.REFUNDED;
    this._updatedAt = new Date();
  }

  /**
   * Establece/cambia la referencia del pago (por ejemplo, al recibir el payment_id de MP)
   */
  setReference(reference: string): void {
    this._reference = reference;
    this._updatedAt = new Date();
  }

  /**
   * Actualiza información específica de MercadoPago en el pago
   */
  setMercadoPagoInfo(info: {
    preferenceId?: string | null;
    externalPaymentId?: string | null;
    status?: string | null;
    statusDetail?: string | null;
    paymentType?: string | null;
    paymentMethodId?: string | null;
    payerEmail?: string | null;
    metadata?: Record<string, unknown>;
  }): void {
    if (typeof info.preferenceId !== 'undefined')
      this._mpPreferenceId = info.preferenceId;
    if (typeof info.externalPaymentId !== 'undefined')
      this._mpExternalPaymentId = info.externalPaymentId;
    if (typeof info.status !== 'undefined') this._mpStatus = info.status;
    if (typeof info.statusDetail !== 'undefined')
      this._mpStatusDetail = info.statusDetail;
    if (typeof info.paymentType !== 'undefined')
      this._mpPaymentType = info.paymentType;
    if (typeof info.paymentMethodId !== 'undefined')
      this._mpPaymentMethodId = info.paymentMethodId;
    if (typeof info.payerEmail !== 'undefined')
      this._mpPayerEmail = info.payerEmail;
    if (typeof info.metadata !== 'undefined')
      this._mpMetadata = {
        ...(this._mpMetadata ?? {}),
        ...(info.metadata ?? {}),
      };
    this._updatedAt = new Date();
  }

  /**
   * Verifica si el pago es válido para aplicar a una factura
   */
  canBeAppliedToInvoice(): boolean {
    return this._status === PaymentStatus.COMPLETED;
  }
}
