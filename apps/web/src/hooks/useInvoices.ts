/**
 * React Query Hooks - Invoices
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  generateInvoice,
  getInvoiceById,
  getInvoiceByReservation,
  getInvoicesByClient,
  getOverdueInvoices,
  getAllInvoices,
} from '@/api/invoices.api';
import { useToast } from '@/contexts/ToastContext';

interface ApiErrorLike {
  response?: {
    data?: {
      message?: string;
    };
  };
}

/**
 * Hook para generar factura
 */
export const useGenerateInvoice = () => {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: generateInvoice,
    onSuccess: (data) => {
      toast.success('Factura generada', `Factura ${data.invoiceNumber} generada exitosamente`);
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
    },
    onError: (error: ApiErrorLike) => {
      toast.error('Error al generar factura', error.response?.data?.message || 'Ocurrió un error inesperado');
    },
  });
};

/**
 * Hook para obtener factura por ID
 */
export const useInvoice = (id: number | undefined) => {
  return useQuery({
    queryKey: ['invoice', id],
    queryFn: () => getInvoiceById(id!),
    enabled: !!id,
  });
};

/**
 * Hook para obtener factura de reserva
 */
export const useInvoiceByReservation = (reservationId: number | undefined) => {
  return useQuery({
    queryKey: ['invoice', 'reservation', reservationId],
    queryFn: () => getInvoiceByReservation(reservationId!),
    enabled: !!reservationId,
    retry: false, // No reintentar si no existe
  });
};

/**
 * Hook para obtener facturas de cliente
 */
export const useClientInvoices = (clientId: number | undefined) => {
  return useQuery({
    queryKey: ['invoices', 'client', clientId],
    queryFn: () => getInvoicesByClient(clientId!),
    enabled: !!clientId,
  });
};

/**
 * Hook para obtener todas las facturas
 */
export const useAllInvoices = () => {
  return useQuery({
    queryKey: ['invoices', 'all'],
    queryFn: () => getAllInvoices(),
  });
};
 
/**
 * Hook para obtener facturas vencidas
 */
export const useOverdueInvoices = () => {
  return useQuery({
    queryKey: ['invoices', 'overdue'],
    queryFn: getOverdueInvoices,
  });
};
