/**
 * React Query Hooks - Payments
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  registerPayment,
  getPaymentById,
  getPaymentsByInvoice,
  getPaymentsByClient,
} from '@/api/payments.api';
import type { CreatePaymentDto } from '@/types/billing.types';
import { useToast } from '@/contexts/ToastContext';

interface ApiErrorLike {
  response?: {
    data?: {
      message?: string;
    };
  };
}

/**
 * Hook para registrar un pago
 */
export const useRegisterPayment = () => {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (data: CreatePaymentDto) => registerPayment(data),
    onSuccess: (data) => {
      toast.success('Pago registrado', `Pago de $${data.amount} registrado exitosamente`);
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
    onError: (error: ApiErrorLike) => {
      toast.error('Error al registrar pago', error.response?.data?.message || 'Ocurrió un error inesperado');
    },
  });
};

/**
 * Hook para obtener pago por ID
 */
export const usePayment = (id: number | undefined) => {
  return useQuery({
    queryKey: ['payment', id],
    queryFn: () => getPaymentById(id!),
    enabled: !!id,
  });
};

/**
 * Hook para obtener pagos de factura
 */
export const useInvoicePayments = (invoiceId: number | undefined) => {
  return useQuery({
    queryKey: ['payments', 'invoice', invoiceId],
    queryFn: () => getPaymentsByInvoice(invoiceId!),
    enabled: !!invoiceId,
  });
};

/**
 * Hook para obtener pagos de cliente
 */
export const useClientPayments = (clientId: number | undefined) => {
  return useQuery({
    queryKey: ['payments', 'client', clientId],
    queryFn: () => getPaymentsByClient(clientId!),
    enabled: !!clientId,
  });
};
