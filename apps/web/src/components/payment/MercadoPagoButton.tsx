/**
 * MercadoPago Payment Button Component
 * Botón para iniciar pago con MercadoPago
 */
import { useState } from 'react';
import { useCreatePaymentPreference } from '../../hooks/useMercadoPago';
import { useToast } from '../../contexts/ToastContext';
import type { PaymentMethod } from '@/types/billing.types';

interface MercadoPagoButtonProps {
  invoiceId: number;
  amount: number;
  disabled?: boolean;
  method: PaymentMethod; // debe ser DEBIT_CARD o CREDIT_CARD
}

export const MercadoPagoButton = ({
  invoiceId,
  amount,
  disabled = false,
  method,
}: MercadoPagoButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const createPreference = useCreatePaymentPreference();
  const { showToast } = useToast();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(value);
  };

  const handlePayment = async () => {
    try {
      setIsLoading(true);
  const result = await createPreference.mutateAsync({ invoiceId, method });

      // Redirigir a MercadoPago
      window.location.href = result.initPoint;
    } catch (error: unknown) {
      let message = 'No se pudo iniciar el pago con MercadoPago';
      if (
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof (error as Record<string, unknown>).response === 'object' &&
        (error as { response?: { data?: { message?: string } } }).response?.data?.message
      ) {
        message = (error as { response?: { data?: { message?: string } } }).response!.data!.message || message;
      }
      showToast({
        type: 'error',
        title: 'Error al crear el pago',
        message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handlePayment}
      disabled={disabled || isLoading}
      className="flex items-center justify-center gap-2 bg-[#009EE3] hover:bg-[#0082C4] text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? (
        <>
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <span>Procesando...</span>
        </>
      ) : (
        <>
          <svg
            className="w-6 h-6"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
          </svg>
          <span>Pagar {formatCurrency(amount)} con MercadoPago</span>
        </>
      )}
    </button>
  );
};
