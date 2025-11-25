/**
 * DebtInvoiceDto
 * Representa una factura con saldo pendiente asociada a un cliente
 */
export class DebtInvoiceDto {
  id!: number;
  invoiceNumber!: string;
  total!: number;
  amountPaid!: number;
  outstandingBalance!: number;
  status!: string;
  isOverdue!: boolean;
  // Detalles enriquecidos de la razón de la deuda
  reservationId?: number;
  checkIn?: Date;
  checkOut?: Date;
  roomNumber?: string;
  roomType?: string;
  description?: string; // Texto legible para mostrar al cliente
}
