/**
 * Modal para saldar deudas pendientes de un cliente antes de continuar con la reserva
 */
import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { useAccountStatement } from '@/hooks/useAccountMovements';
import { useClientInvoices } from '@/hooks/useInvoices';
import { PaymentForm } from '@/components/ui/PaymentForm';
import { MercadoPagoButton } from '@/components/payment/MercadoPagoButton';
import { PaymentMethod } from '@/types/billing.types';
import { useToast } from '@/contexts/ToastContext';
import { registerPayment } from '@/api/payments.api';

interface SettleDebtModalProps {
  clientId: number;
  clientName: string;
  dni: string;
  onClose: () => void;
  onSettled?: () => void; // llamado cuando el saldo llega a 0
  initialInvoices?: {
    id: number;
    invoiceNumber: string;
    total: number;
    amountPaid: number;
    outstandingBalance: number;
    status: string;
    isOverdue: boolean;
    reservationId?: number;
    checkIn?: string;
    checkOut?: string;
    roomNumber?: string;
    roomType?: string;
    description?: string;
  }[];
}

interface ApiErrorLike {
  response?: {
    data?: {
      message?: string;
    };
  };
}

export const SettleDebtModal = ({ clientId, clientName, dni, onClose, onSettled, initialInvoices }: SettleDebtModalProps) => {
  const { data: statement, isLoading: loadingStatement, refetch: refetchStatement } = useAccountStatement(clientId, 1, 50);
  const { data: invoices, isLoading: loadingInvoices, refetch: refetchInvoices } = useClientInvoices(clientId);
  const { showToast } = useToast();

  // Control individual del método seleccionado por invoice (para renderizar MP sólo débito/crédito)
  const [selectedMethods, setSelectedMethods] = useState<Record<number, PaymentMethod>>({});
  const [isBulkPaying, setIsBulkPaying] = useState(false);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount);

  interface DisplayInvoice {
    id: number; invoiceNumber: string; total: number; amountPaid: number; outstandingBalance: number; status: string; isOverdue: boolean;
    reservationId?: number; checkIn?: string; checkOut?: string; roomNumber?: string; roomType?: string; description?: string;
  }
  const unpaidInvoices: DisplayInvoice[] = useMemo(() => {
    const source = invoices && invoices.length > 0 ? invoices : (initialInvoices || []);
    return source
      .filter((inv) => inv.outstandingBalance > 0)
      .map((inv) => inv as DisplayInvoice);
  }, [invoices, initialInvoices]);

  const totalOutstanding = useMemo(() => {
    if (statement && statement.currentBalance > 0) {
      return statement.currentBalance;
    }
    return unpaidInvoices.reduce((acc, inv) => acc + inv.outstandingBalance, 0);
  }, [statement, unpaidInvoices]);

  const handleBulkPayment = async ({
    amount,
    method,
    reference,
  }: {
    amount: number;
    method: PaymentMethod;
    reference?: string;
  }) => {
    if (amount <= 0 || unpaidInvoices.length === 0) {
      return;
    }
    setIsBulkPaying(true);
    try {
      let remaining = amount;
      for (const invoice of unpaidInvoices) {
        if (remaining <= 0) break;
        const paymentAmount = Math.min(invoice.outstandingBalance, remaining);
        if (paymentAmount <= 0) continue;
        await registerPayment({
          invoiceId: invoice.id,
          clientId,
          amount: paymentAmount,
          method,
          reference,
        });
        remaining -= paymentAmount;
      }

      await Promise.all([refetchInvoices(), refetchStatement()]);

      showToast({
        type: 'success',
        title: 'Pago consolidado registrado',
        message: remaining <= 0
          ? 'Se aplicó el pago sobre todas las facturas pendientes.'
          : 'Se aplicó el pago hasta cubrir el saldo disponible.',
      });
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Error al procesar el pago',
        message:
          (error as ApiErrorLike)?.response?.data?.message ||
          'No se pudo registrar el pago consolidado. Intente nuevamente.',
      });
    } finally {
      setIsBulkPaying(false);
    }
  };

  useEffect(() => {
    if (!statement) return;
    if (statement.currentBalance <= 0) {
      onSettled?.();
      onClose();
    }
  }, [statement, onSettled, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop: no cerrar si aún hay deuda */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => {
          if (!statement || statement.currentBalance > 0) return; // bloquear cierre con deuda
          onClose();
        }}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h3 className="text-xl font-semibold">Cliente deudor</h3>
            <p className="text-sm text-gray-600">{clientName} · DNI: {dni}</p>
          </div>
          {statement && statement.currentBalance <= 0 ? (
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X size={20} />
            </button>
          ) : (
            <div className="text-xs text-gray-400">Saldar deuda para cerrar</div>
          )}
        </div>

        <div className="p-4 space-y-4 max-h-[80vh] overflow-auto">
          {/* Resumen de deuda */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            {loadingStatement ? (
              <p className="text-amber-800">Cargando saldo...</p>
            ) : statement ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-800">El cliente posee deuda pendiente</p>
                  <p className="text-sm text-amber-700">Debe saldar antes de continuar con la reserva</p>
                </div>
                <p className="text-2xl font-bold text-amber-900">{formatCurrency(statement.currentBalance)}</p>
              </div>
            ) : null}
          </div>

          {/* Facturas con saldo pendiente */}
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="p-4 border-b">
              <h4 className="font-semibold">Facturas con saldo</h4>
              <p className="text-sm text-gray-600">Pague las facturas pendientes para continuar</p>
            </div>

            {loadingInvoices ? (
              <div className="p-4 text-gray-600">Cargando facturas...</div>
            ) : unpaidInvoices.length === 0 ? (
              <div className="p-4 text-green-700">No hay facturas impagas</div>
            ) : (
              <div className="divide-y">
                {unpaidInvoices.map((inv) => {
                  return (
                    <div key={inv.id} className="p-4 space-y-3">
                      <div>
                        <p className="text-sm text-gray-500">Factura #{inv.invoiceNumber}</p>
                        {inv.description && (
                          <p className="text-xs text-gray-600 mt-1">{inv.description}</p>
                        )}
                        {!inv.description && inv.checkIn && inv.checkOut && (
                          <p className="text-xs text-gray-600 mt-1">Estadía del {inv.checkIn.substring(0,10)} al {inv.checkOut.substring(0,10)}{inv.roomNumber ? ` · Habitación ${inv.roomNumber}` : ''}{inv.roomType ? ` (${inv.roomType})` : ''}</p>
                        )}
                        <p className="text-gray-800">Total: {formatCurrency(inv.total)}</p>
                        <p className="text-green-700 text-sm">Pagado: {formatCurrency(inv.amountPaid)}</p>
                        <p className="text-red-600 font-semibold">Saldo: {formatCurrency(inv.outstandingBalance)}</p>
                      </div>

                      <div className="space-y-2">
                        <p className="text-xs uppercase tracking-wide text-gray-500">Pago online (opcional)</p>
                        <div className="flex flex-col gap-2 md:flex-row">
                          {[PaymentMethod.DEBIT_CARD, PaymentMethod.CREDIT_CARD].map((method) => (
                            <MercadoPagoButton
                              key={`${inv.id}-${method}`}
                              invoiceId={inv.id}
                              amount={inv.outstandingBalance}
                              method={method}
                              disabled={inv.outstandingBalance <= 0}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pago consolidado manual */}
          {totalOutstanding > 0 && (
            <div className="bg-white border border-blue-200 rounded-lg">
              <div className="p-4 border-b">
                <h4 className="font-semibold text-blue-900">Pago consolidado</h4>
                <p className="text-sm text-blue-700">
                  Se suman todas las deudas y se registran en una sola operación manual.
                </p>
              </div>
              <div className="p-4">
                <PaymentForm
                  invoiceId="bulk-debt"
                  outstandingAmount={totalOutstanding}
                  onSubmit={handleBulkPayment}
                  isLoading={isBulkPaying}
                  initialMethod={PaymentMethod.CASH}
                />
                <p className="text-xs text-gray-500 mt-2">
                  El sistema aplicará automáticamente el pago en cada factura hasta cubrir el saldo.
                </p>
              </div>
            </div>
          )}

          {/* Acciones */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button onClick={onClose} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cerrar</button>
            <button
              onClick={async () => {
                await Promise.all([refetchInvoices(), refetchStatement()]);
                if (statement && statement.currentBalance <= 0) {
                  onSettled?.();
                  onClose();
                }
              }}
              disabled={loadingStatement || (statement ? statement.currentBalance > 0 : true)}
              className={`px-4 py-2 rounded-lg font-medium ${
                statement && statement.currentBalance <= 0
                  ? 'bg-primary-600 text-white hover:bg-primary-700'
                  : 'bg-gray-300 text-gray-600 cursor-not-allowed'
              }`}
            >
              Continuar con la reserva
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
