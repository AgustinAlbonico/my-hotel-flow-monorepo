/**
 * Invoice Domain Entity
 * Representa una factura generada para una reserva
 */

export enum InvoiceStatus {
  PENDING = 'PENDING', // Pendiente de pago
  PARTIAL = 'PARTIAL', // Pagada parcialmente
  PAID = 'PAID', // Pagada completamente
  CANCELLED = 'CANCELLED', // Cancelada
}

export class Invoice {
  private readonly _id: number;
  private readonly _reservationId: number;
  private readonly _clientId: number;
  private _invoiceNumber: string; // Número de factura único
  private _subtotal: number;
  private _taxRate: number; // Porcentaje de impuesto (ej: 21 para IVA 21%)
  private _taxAmount: number;
  private _total: number;
  private _amountPaid: number;
  private _status: InvoiceStatus;
  private _issuedAt: Date;
  private _dueDate: Date;
  private _notes: string | null;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  private constructor(data: {
    id: number;
    reservationId: number;
    clientId: number;
    invoiceNumber: string;
    subtotal: number;
    taxRate: number;
    taxAmount: number;
    total: number;
    amountPaid: number;
    status: InvoiceStatus;
    issuedAt: Date;
    dueDate: Date;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    this._id = data.id;
    this._reservationId = data.reservationId;
    this._clientId = data.clientId;
    this._invoiceNumber = data.invoiceNumber;
    this._subtotal = data.subtotal;
    this._taxRate = data.taxRate;
    this._taxAmount = data.taxAmount;
    this._total = data.total;
    this._amountPaid = data.amountPaid;
    this._status = data.status;
    this._issuedAt = data.issuedAt;
    this._dueDate = data.dueDate;
    this._notes = data.notes;
    this._createdAt = data.createdAt;
    this._updatedAt = data.updatedAt;
  }

  /**
   * Factory method para crear una nueva factura
   */
  static create(
    reservationId: number,
    clientId: number,
    subtotal: number,
    taxRate: number = 21,
    notes: string | null = null,
  ): Invoice {
    const taxAmount = this.calculateTaxAmount(subtotal, taxRate);
    const total = subtotal + taxAmount;
    const issuedAt = new Date();
    const dueDate = new Date(issuedAt.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 días

    return new Invoice({
      id: 0,
      reservationId,
      clientId,
      invoiceNumber: '', // Se genera al persistir
      subtotal,
      taxRate,
      taxAmount,
      total,
      amountPaid: 0,
      status: InvoiceStatus.PENDING,
      issuedAt,
      dueDate,
      notes,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static reconstruct(data: {
    id: number;
    reservationId: number;
    clientId: number;
    invoiceNumber: string;
    subtotal: number;
    taxRate: number;
    taxAmount: number;
    total: number;
    amountPaid: number;
    status: InvoiceStatus;
    issuedAt: Date;
    dueDate: Date;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): Invoice {
    return new Invoice(data);
  }

  private static calculateTaxAmount(subtotal: number, taxRate: number): number {
    return Math.round(((subtotal * taxRate) / 100) * 100) / 100; // Redondear a 2 decimales
  }

  // Getters
  get id(): number {
    return this._id;
  }
  get reservationId(): number {
    return this._reservationId;
  }
  get clientId(): number {
    return this._clientId;
  }
  get invoiceNumber(): string {
    return this._invoiceNumber;
  }
  get subtotal(): number {
    return this._subtotal;
  }
  get taxRate(): number {
    return this._taxRate;
  }
  get taxAmount(): number {
    return this._taxAmount;
  }
  get total(): number {
    return this._total;
  }
  get amountPaid(): number {
    return this._amountPaid;
  }
  get status(): InvoiceStatus {
    return this._status;
  }
  get issuedAt(): Date {
    return this._issuedAt;
  }
  get dueDate(): Date {
    return this._dueDate;
  }
  get notes(): string | null {
    return this._notes;
  }
  get createdAt(): Date {
    return this._createdAt;
  }
  get updatedAt(): Date {
    return this._updatedAt;
  }

  /**
   * Calcula el saldo pendiente
   */
  getOutstandingBalance(): number {
    return Math.max(0, this._total - this._amountPaid);
  }

  /**
   * Verifica si la factura está vencida
   */
  isOverdue(): boolean {
    return (
      this._status !== InvoiceStatus.PAID &&
      this._status !== InvoiceStatus.CANCELLED &&
      new Date() > this._dueDate
    );
  }

  /**
   * Verifica si se puede registrar un pago
   */
  canReceivePayment(): boolean {
    return (
      this._status !== InvoiceStatus.PAID &&
      this._status !== InvoiceStatus.CANCELLED
    );
  }

  /**
   * Registra un pago y actualiza el estado
   */
  recordPayment(amount: number): void {
    if (!this.canReceivePayment()) {
      throw new Error(
        'No se pueden registrar pagos en una factura pagada o cancelada',
      );
    }

    if (amount <= 0) {
      throw new Error('El monto del pago debe ser mayor a 0');
    }

    const outstandingBalance = this.getOutstandingBalance();
    if (amount > outstandingBalance) {
      throw new Error(
        `El pago ($${amount}) excede el saldo pendiente ($${outstandingBalance})`,
      );
    }

    this._amountPaid += amount;
    this.updateStatus();
    this._updatedAt = new Date();
  }

  /**
   * Cancela la factura
   */
  cancel(): void {
    if (this._amountPaid > 0) {
      throw new Error(
        'No se puede cancelar una factura que ya tiene pagos registrados',
      );
    }

    this._status = InvoiceStatus.CANCELLED;
    this._updatedAt = new Date();
  }

  /**
   * Actualiza el estado según el monto pagado
   */
  private updateStatus(): void {
    const outstandingBalance = this.getOutstandingBalance();

    if (outstandingBalance === 0) {
      this._status = InvoiceStatus.PAID;
    } else if (this._amountPaid > 0) {
      this._status = InvoiceStatus.PARTIAL;
    } else {
      this._status = InvoiceStatus.PENDING;
    }
  }

  /**
   * Asigna el número de factura (se hace al persistir)
   */
  setInvoiceNumber(invoiceNumber: string): void {
    if (this._invoiceNumber) {
      throw new Error('El número de factura ya fue asignado');
    }
    this._invoiceNumber = invoiceNumber;
  }
}
