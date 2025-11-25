/**
 * MercadoPago API Client
 */
import api from './axios.config';
import type {
  CreatePaymentPreferenceResponse,
  MercadoPagoConfig,
} from '../types/mercadopago.types';
import type { PaymentMethod } from '../types/billing.types';

export const mercadoPagoApi = {
  /**
   * Crear preferencia de pago para una factura
   */
  createPaymentPreference: async (
    invoiceId: number,
    method: PaymentMethod,
  ): Promise<CreatePaymentPreferenceResponse> => {
    const response = await api.post('/webhooks/mercadopago/create-preference', {
      invoiceId,
      method,
    });
    return response.data;
  },

  /**
   * Obtener configuración de MercadoPago
   */
  getConfig: async (): Promise<MercadoPagoConfig> => {
    const response = await api.get('/webhooks/mercadopago/config');
    return response.data;
  },
};
