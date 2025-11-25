/**
 * MercadoPago Types
 * Tipos para integración con MercadoPago
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

export interface MercadoPagoPayment {
  id: number;
  invoiceId: number;
  clientId: number;
  preferenceId: string;
  externalPaymentId: string | null;
  status: MercadoPagoPaymentStatus;
  paymentType: MercadoPagoPaymentType | null;
  amount: number;
  statusDetail: string | null;
  paymentMethodId: string | null;
  payerEmail: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentPreferenceResponse {
  preferenceId: string;
  initPoint: string;
  sandboxInitPoint: string;
}

export interface MercadoPagoConfig {
  publicKey: string;
  isConfigured: boolean;
}
