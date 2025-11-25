/**
 * Types - Invoices & Payments
 */

export enum InvoiceStatus {
  PENDING = 'PENDING',
  PARTIAL = 'PARTIAL',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
}

export enum PaymentMethod {
  CASH = 'CASH',
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CHECK = 'CHECK',
  OTHER = 'OTHER',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export interface Invoice {
  id: number;
  invoiceNumber: string;
  reservationId: number;
  clientId: number;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  amountPaid: number;
  outstandingBalance: number;
  status: InvoiceStatus;
  issuedAt: string;
  dueDate: string;
  isOverdue: boolean;
  notes: string | null;
  createdAt: string;
  // Relaciones opcionales (cuando están populadas)
  client?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  reservation?: {
    id: number;
  };
}

export interface Payment {
  id: number;
  invoiceId: number;
  clientId: number;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  reference: string | null;
  notes: string | null;
  paidAt: string;
  createdAt: string;
}

export interface CreatePaymentDto {
  invoiceId: number;
  clientId: number;
  amount: number;
  method: PaymentMethod;
  reference?: string;
  notes?: string;
}

export interface InvoiceListItem {
  id: number;
  invoiceNumber: string;
  reservationId: number;
  clientId: number;
  total: number;
  amountPaid: number;
  outstandingBalance: number;
  status: InvoiceStatus;
  issuedAt: string;
  dueDate: string;
  isOverdue: boolean;
}

export interface PaymentListItem {
  id: number;
  invoiceId?: number;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  reference: string | null;
  paidAt: string;
}
