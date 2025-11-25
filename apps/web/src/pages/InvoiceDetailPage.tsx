/**
 * Invoice Detail Page - Detalle de factura con opción de pago
 */
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useInvoice } from '@/hooks/useInvoices';
import { useInvoicePayments, useRegisterPayment } from '@/hooks/usePayments';
import { InvoiceStatusBadge } from '@/components/ui/InvoiceStatusBadge';
import { PaymentForm } from '@/components/ui/PaymentForm';
import { PaymentListItem } from '@/components/ui/PaymentListItem';
import { MercadoPagoButton } from '@/components/payment/MercadoPagoButton';
import { PaymentMethod } from '@/types/billing.types';

export const InvoiceDetailPage = () => {
    const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const invoiceId = parseInt(id || '0');

    const { data: invoice, isLoading: loadingInvoice, refetch: refetchInvoice } = useInvoice(invoiceId);
    const { data: payments, isLoading: loadingPayments, refetch: refetchPayments } = useInvoicePayments(invoiceId);
    const registerPayment = useRegisterPayment();

    // Polling suave para actualizar estado tras retorno de pasarela
    useEffect(() => {
        if (!invoice) return;
        if (invoice.outstandingBalance <= 0) return;

        const interval = setInterval(() => {
            refetchInvoice();
            refetchPayments();
        }, 5000);

        // Detener a los 60 segundos
        const timeout = setTimeout(() => clearInterval(interval), 60000);

        return () => {
            clearInterval(interval);
            clearTimeout(timeout);
        };
        // Dependemos solo de invoiceId para evitar re-crear el polling en cada cambio de referencia
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [invoiceId]);

    const handleRegisterPayment = (data: {
        amount: number;
        method: PaymentMethod;
        reference?: string;
    }) => {
        if (!invoice) return;
        
        registerPayment.mutate({
            invoiceId,
            clientId: invoice.clientId,
            amount: data.amount,
            method: data.method,
            reference: data.reference,
        });
    };

    if (loadingInvoice) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-gray-500">Cargando factura...</div>
            </div>
        );
    }

    if (!invoice) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-700">Factura no encontrada</p>
                <button
                    onClick={() => navigate('/invoices')}
                    className="mt-2 text-blue-600 hover:underline"
                >
                    ← Volver al listado
                </button>
            </div>
        );
    }

    const canReceivePayment = invoice.outstandingBalance > 0 && invoice.status !== 'CANCELLED';

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <button
                        onClick={() => navigate('/invoices')}
                        className="text-blue-600 hover:underline mb-2"
                    >
                        ← Volver a facturas
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900">
                        Factura #{invoice.invoiceNumber}
                    </h1>
                    <p className="text-gray-600 mt-1">Reserva #{invoice.reservationId}</p>
                </div>
                <InvoiceStatusBadge status={invoice.status} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                                        {/* Botón imprimir recibo */}
                                        <div className="mt-2">
                                            <Link
                                                to={`/invoices/${invoice.id}/receipt`}
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg text-sm font-medium hover:bg-gray-700"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 9V2h12v7M6 18h12V9H6v9zm0 0v4m12-4v4M9 13h6" />
                                                </svg>
                                                Imprimir Recibo
                                            </Link>
                                        </div>
                {/* Columna izquierda: Info de la factura */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Detalles de la factura */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h2 className="text-xl font-semibold mb-4">Detalles de la factura</h2>

                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Subtotal</span>
                                <span className="font-medium">${invoice.subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">
                                    Impuestos ({(invoice.taxRate * 100).toFixed(0)}%)
                                </span>
                                <span className="font-medium">${invoice.taxAmount.toFixed(2)}</span>
                            </div>
                            <div className="border-t pt-3 flex justify-between text-lg">
                                <span className="font-semibold">Total</span>
                                <span className="font-bold">${invoice.total.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-green-600">
                                <span>Pagado</span>
                                <span className="font-medium">${invoice.amountPaid.toFixed(2)}</span>
                            </div>
                            <div
                                className={`border-t pt-3 flex justify-between text-lg ${invoice.outstandingBalance > 0 ? 'text-red-600' : 'text-green-600'
                                    }`}
                            >
                                <span className="font-semibold">Saldo pendiente</span>
                                <span className="font-bold">${invoice.outstandingBalance.toFixed(2)}</span>
                            </div>
                        </div>

                        {/* Fechas */}
                        <div className="mt-6 pt-6 border-t grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-gray-500">Fecha de emisión</p>
                                <p className="font-medium">
                                    {new Date(invoice.issuedAt).toLocaleDateString()}
                                </p>
                            </div>
                            <div>
                                <p className="text-gray-500">Fecha de vencimiento</p>
                                <p className={`font-medium ${invoice.isOverdue ? 'text-red-600' : ''}`}>
                                    {new Date(invoice.dueDate).toLocaleDateString()}
                                    {invoice.isOverdue && <span className="ml-1">⚠️ Vencida</span>}
                                </p>
                            </div>
                        </div>

                        {/* Notas */}
                        {invoice.notes && (
                            <div className="mt-4 pt-4 border-t">
                                <p className="text-gray-500 text-sm mb-1">Notas</p>
                                <p className="text-gray-700">{invoice.notes}</p>
                            </div>
                        )}
                    </div>

                    {/* Historial de pagos */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h2 className="text-xl font-semibold mb-4">Historial de pagos</h2>

                        {loadingPayments ? (
                            <p className="text-gray-500">Cargando pagos...</p>
                        ) : payments && payments.length > 0 ? (
                            <div className="space-y-3">
                                {payments.map((payment) => (
                                    <PaymentListItem key={payment.id} payment={payment} />
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-center py-4">
                                No hay pagos registrados para esta factura
                            </p>
                        )}
                    </div>
                </div>

                {/* Columna derecha: Formulario de pago */}
                {canReceivePayment && (
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-6 space-y-4">
                            <h2 className="text-xl font-semibold">Registrar pago</h2>
                            
                            {/* Botón de MercadoPago: solo para débito/crédito */}
                            {(selectedMethod === PaymentMethod.DEBIT_CARD || selectedMethod === PaymentMethod.CREDIT_CARD) && (
                              <div className="pb-4 border-b border-gray-200">
                                  <p className="text-sm text-gray-600 mb-3">Pago con tarjeta (redirige a pasarela segura):</p>
                                  <MercadoPagoButton 
                                      invoiceId={invoice.id} 
                                      amount={invoice.outstandingBalance}
                                      method={selectedMethod}
                                  />
                              </div>
                            )}

                            {/* Separador */}
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-300"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-2 bg-white text-gray-500">o</span>
                                </div>
                            </div>

                            {/* Formulario de pago manual */}
                            <div>
                                <p className="text-sm text-gray-600 mb-3">Registrar pago manual:</p>
                                <PaymentForm
                                    invoiceId={invoice.id.toString()}
                                    outstandingAmount={invoice.outstandingBalance}
                                    onSubmit={handleRegisterPayment}
                                    isLoading={registerPayment.isPending}
                                    onMethodChange={setSelectedMethod}
                                    initialMethod={selectedMethod}
                                />
                            </div>
                                                        {/* Enlace rápido a recibo para impresión incluso con saldo parcial */}
                                                        <div className="pt-2 border-t">
                                                            <Link
                                                                to={`/invoices/${invoice.id}/receipt`}
                                                                className="block w-full text-center text-xs text-blue-600 hover:underline"
                                                            >
                                                                Ver versión imprimible ↗
                                                            </Link>
                                                        </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
