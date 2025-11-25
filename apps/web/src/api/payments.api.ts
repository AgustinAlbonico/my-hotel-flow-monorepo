/**
 * API Client - Payments
 */
import api from './axios.config';
import type { Payment, PaymentListItem, CreatePaymentDto } from '@/types/billing.types';

/**
 * Registrar un nuevo pago
 */
export const registerPayment = async (data: CreatePaymentDto): Promise<Payment> => {
  const response = await api.post<Payment>('/payments', data);
  return response.data;
};

/**
 * Obtener pago por ID
 */
export const getPaymentById = async (id: number): Promise<Payment> => {
  const response = await api.get<Payment>(`/payments/${id}`);
  return response.data;
};

/**
 * Obtener pagos de una factura
 */
export const getPaymentsByInvoice = async (invoiceId: number): Promise<PaymentListItem[]> => {
  const response = await api.get<PaymentListItem[]>(`/payments/invoice/${invoiceId}`);
  return response.data;
};

/**
 * Obtener pagos de un cliente
 */
export const getPaymentsByClient = async (clientId: number): Promise<PaymentListItem[]> => {
  const response = await api.get<PaymentListItem[]>(`/payments/client/${clientId}`);
  return response.data;
};
