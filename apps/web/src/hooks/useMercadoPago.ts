/**
 * MercadoPago React Query Hooks
 */
import { useQuery, useMutation } from '@tanstack/react-query';
import { mercadoPagoApi } from '../api/mercadopago.api';
import type { PaymentMethod } from '@/types/billing.types';

/**
 * Hook para obtener la configuración de MercadoPago
 */
export const useMercadoPagoConfig = () => {
  return useQuery({
    queryKey: ['mercadopago-config'],
    queryFn: () => mercadoPagoApi.getConfig(),
  });
};

/**
 * Hook para crear una preferencia de pago
 */
export const useCreatePaymentPreference = () => {
  return useMutation({
    mutationFn: (params: { invoiceId: number; method: PaymentMethod }) =>
      mercadoPagoApi.createPaymentPreference(params.invoiceId, params.method),
  });
};
