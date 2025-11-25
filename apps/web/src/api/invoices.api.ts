/**
 * API Client - Invoices
 */
import api from './axios.config';
import type { Invoice, InvoiceListItem } from '@/types/billing.types';

/**
 * Generar factura para una reserva
 */
export const generateInvoice = async (reservationId: number): Promise<Invoice> => {
  const response = await api.post<Invoice>(`/invoices/generate/${reservationId}`);
  return response.data;
};

/**
 * Obtener factura por ID
 */
export const getInvoiceById = async (id: number): Promise<Invoice> => {
  const response = await api.get<Invoice>(`/invoices/${id}`);
  return response.data;
};

/**
 * Obtener factura por ID de reserva
 */
export const getInvoiceByReservation = async (reservationId: number): Promise<Invoice> => {
  const response = await api.get<Invoice>(`/invoices/reservation/${reservationId}`);
  return response.data;
};

/**
 * Obtener facturas de un cliente
 */
export const getInvoicesByClient = async (clientId: number): Promise<InvoiceListItem[]> => {
  const response = await api.get<InvoiceListItem[]>(`/invoices/client/${clientId}`);
  return response.data;
};

/**
 * Obtener facturas vencidas
 */
export const getOverdueInvoices = async (): Promise<InvoiceListItem[]> => {
  const response = await api.get<InvoiceListItem[]>('/invoices/list/overdue');
  return response.data;
};

/**
 * Obtener todas las facturas (para listado principal)
 */
export const getAllInvoices = async (): Promise<InvoiceListItem[]> => {
  const response = await api.get<InvoiceListItem[]>('/invoices');
  return response.data;
};
