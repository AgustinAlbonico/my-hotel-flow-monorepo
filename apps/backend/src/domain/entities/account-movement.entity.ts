/**
 * Account Movement Entity - Movimiento de Cuenta Corriente
 * Patrón: Domain Entity (Clean Architecture)
 * Responsabilidad: Representar movimientos en la cuenta corriente del cliente
 */

export enum MovementType {
  CHARGE = 'CHARGE', // Cargo (factura, servicio adicional)
  PAYMENT = 'PAYMENT', // Pago recibido
  ADJUSTMENT = 'ADJUSTMENT', // Ajuste manual (nota de crédito/débito)
}

export enum MovementStatus {
  PENDING = 'PENDING', // Pendiente de procesamiento
  COMPLETED = 'COMPLETED', // Procesado y confirmado
  REVERSED = 'REVERSED', // Revertido (cancelado)
}

export class AccountMovement {
  constructor(
    public readonly id: number,
    public readonly clientId: number,
    public readonly type: MovementType,
    public readonly amount: number, // Positivo = cargo, puede ser negativo para pagos
    public readonly balance: number, // Balance después de este movimiento
    public status: MovementStatus,
    public readonly reference: string, // Referencia (ID de factura, pago, etc.)
    public readonly description: string,
    public readonly metadata: Record<string, any> | null, // Info adicional (JSON)
    public readonly createdAt: Date,
    public updatedAt: Date,
  ) {}

  /**
   * Crear un movimiento de cargo (factura)
   */
  static createCharge(
    clientId: number,
    amount: number,
    balance: number,
    reference: string,
    description: string,
    metadata?: Record<string, any>,
  ): AccountMovement {
    if (amount <= 0) {
      throw new Error('El monto del cargo debe ser positivo');
    }

    return new AccountMovement(
      0, // ID se asigna por la DB
      clientId,
      MovementType.CHARGE,
      amount,
      balance,
      MovementStatus.COMPLETED,
      reference,
      description,
      metadata || null,
      new Date(),
      new Date(),
    );
  }

  /**
   * Crear un movimiento de pago
   */
  static createPayment(
    clientId: number,
    amount: number,
    balance: number,
    reference: string,
    description: string,
    metadata?: Record<string, any>,
  ): AccountMovement {
    if (amount <= 0) {
      throw new Error('El monto del pago debe ser positivo');
    }

    return new AccountMovement(
      0,
      clientId,
      MovementType.PAYMENT,
      -amount, // Negativo porque reduce el balance
      balance,
      MovementStatus.COMPLETED,
      reference,
      description,
      metadata || null,
      new Date(),
      new Date(),
    );
  }

  /**
   * Crear un ajuste manual
   */
  static createAdjustment(
    clientId: number,
    amount: number, // Puede ser positivo o negativo
    balance: number,
    reference: string,
    description: string,
    metadata?: Record<string, any>,
  ): AccountMovement {
    return new AccountMovement(
      0,
      clientId,
      MovementType.ADJUSTMENT,
      amount,
      balance,
      MovementStatus.PENDING,
      reference,
      description,
      metadata || null,
      new Date(),
      new Date(),
    );
  }

  /**
   * Marcar como completado
   */
  markAsCompleted(): void {
    if (this.status === MovementStatus.REVERSED) {
      throw new Error('No se puede completar un movimiento revertido');
    }
    this.status = MovementStatus.COMPLETED;
    this.updatedAt = new Date();
  }

  /**
   * Revertir movimiento
   */
  reverse(): void {
    if (this.status === MovementStatus.REVERSED) {
      throw new Error('El movimiento ya está revertido');
    }
    this.status = MovementStatus.REVERSED;
    this.updatedAt = new Date();
  }

  /**
   * Determinar si el movimiento aumenta el balance
   */
  isDebit(): boolean {
    return this.amount > 0;
  }

  /**
   * Determinar si el movimiento reduce el balance
   */
  isCredit(): boolean {
    return this.amount < 0;
  }
}
