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
import { useToast } from '@/contexts/ToastContext';
import { API_URL, TOKEN_KEY } from '@/config/constants';
import { getToken } from '@/utils/storage';

export const InvoiceDetailPage = () => {
    const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const toast = useToast();

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
        
        registerPayment.mutate(
            {
                invoiceId,
                clientId: invoice.clientId,
                amount: data.amount,
                method: data.method,
                reference: data.reference,
            },
            {
                onSuccess: async () => {
                    // Refrescar datos locales
                    await Promise.all([refetchInvoice(), refetchPayments()]);
                    
                    // Verificar si la factura está completamente pagada después del refresh
                    const updatedInvoice = await refetchInvoice();
                    if (updatedInvoice.data && updatedInvoice.data.outstandingBalance <= 0) {
                        toast.success(
                            '¡Pago completado!',
                            'La factura ha sido pagada en su totalidad'
                        );
                        // Redirigir al listado después de 2 segundos
                        setTimeout(() => {
                            navigate('/invoices');
                        }, 2000);
                    }
                },
            }
        );
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
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <button
                        onClick={() => navigate('/invoices')}
                        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-3 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Volver a facturas
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900">
                        Factura #{invoice.invoiceNumber}
                    </h1>
                    <p className="text-gray-600 mt-1">Reserva #{invoice.reservationId}</p>
                </div>
                <div className="text-right">
                    <InvoiceStatusBadge status={invoice.status} />
                    {invoice.outstandingBalance <= 0 && (
                        <div className="mt-2 inline-flex items-center gap-1 text-green-600 text-sm font-medium">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Pagado completamente
                        </div>
                    )}
                </div>
            </div>

            {/* Mensaje de éxito si está completamente pagada */}
            {invoice.outstandingBalance <= 0 && (
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
                    <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                            <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-green-900">¡Factura pagada completamente!</h3>
                            <p className="text-green-700 mt-1">Esta factura no tiene saldo pendiente.</p>
                        </div>
                        <button
                            onClick={async () => {
                                try {
                                    // Usar fetch nativo para evitar que axios procese el blob
                                    const token = getToken(TOKEN_KEY);
                                    const response = await fetch(`${API_URL}/invoices/${invoice.id}/download-receipt`, {
                                        headers: {
                                            'Authorization': `Bearer ${token}`
                                        }
                                    });

                                    if (!response.ok) {
                                        throw new Error('Error al descargar el comprobante');
                                    }

                                    const blob = await response.blob();
                                    const url = window.URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `comprobante-${invoice.invoiceNumber}.pdf`;
                                    document.body.appendChild(a);
                                    a.click();
                                    document.body.removeChild(a);
                                    window.URL.revokeObjectURL(url);
                                    
                                    toast.success('Comprobante descargado correctamente');
                                } catch (error) {
                                    console.error('Error:', error);
                                    toast.error('Error al descargar el comprobante');
                                }
                            }}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 9V2h12v7M6 18h12V9H6v9zm0 0v4m12-4v4M9 13h6" />
                            </svg>
                            Descargar Comprobante
                        </button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Columna izquierda: Info de la factura */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Información del Cliente */}
                    {invoice.client && (
                        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
                            <h2 className="text-xl font-semibold mb-4 text-gray-900">Cliente</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-500">Nombre completo</p>
                                    <p className="font-medium text-gray-900">
                                        {invoice.client.firstName} {invoice.client.lastName}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Email</p>
                                    <p className="font-medium text-gray-900">{invoice.client.email}</p>
                                </div>
                                {invoice.client.phone && (
                                    <div>
                                        <p className="text-sm text-gray-500">Teléfono</p>
                                        <p className="font-medium text-gray-900">📞 {invoice.client.phone}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Información de la Estadía */}
                    {invoice.reservation && (
                        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
                            <h2 className="text-xl font-semibold mb-4 text-gray-900">Estadía</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-500">Código de reserva</p>
                                    <p className="font-medium text-gray-900">{invoice.reservation.code}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Estado</p>
                                    <p className="font-medium text-gray-900">{invoice.reservation.status}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Check-in</p>
                                    <p className="font-medium text-gray-900">
                                        {new Date(invoice.reservation.checkIn).toLocaleDateString()}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Check-out</p>
                                    <p className="font-medium text-gray-900">
                                        {new Date(invoice.reservation.checkOut).toLocaleDateString()}
                                    </p>
                                </div>
                                {invoice.reservation.room && (
                                    <div className="md:col-span-2">
                                        <p className="text-sm text-gray-500 mb-2">Habitación</p>
                                        <div className="flex items-center gap-3">
                                            <span className="inline-flex items-center bg-blue-50 text-blue-700 px-3 py-2 rounded-lg font-medium">
                                                🏠 Habitación {invoice.reservation.room.number}
                                            </span>
                                            <span className="text-gray-600">
                                                {invoice.reservation.room.type}
                                                {invoice.reservation.room.floor && ` • Piso ${invoice.reservation.room.floor}`}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Detalles de la factura */}
                    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
                        <h2 className="text-xl font-semibold mb-6 text-gray-900">Detalles de la factura</h2>

                        <div className="space-y-4">
                            <div className="flex justify-between py-2">
                                <span className="text-gray-600">Subtotal</span>
                                <span className="font-medium text-gray-900">${invoice.subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between py-2">
                                <span className="text-gray-600">
                                    Impuestos ({(invoice.taxRate * 100).toFixed(0)}%)
                                </span>
                                <span className="font-medium text-gray-900">${invoice.taxAmount.toFixed(2)}</span>
                            </div>
                            <div className="border-t-2 border-gray-300 pt-3 flex justify-between text-lg">
                                <span className="font-semibold text-gray-900">Total</span>
                                <span className="font-bold text-gray-900">${invoice.total.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between py-2 bg-green-50 -mx-6 px-6 rounded">
                                <span className="text-green-700 font-medium">Pagado</span>
                                <span className="font-bold text-green-700">${invoice.amountPaid.toFixed(2)}</span>
                            </div>
                            <div
                                className={`border-t-2 pt-3 flex justify-between text-lg -mx-6 px-6 py-3 rounded ${invoice.outstandingBalance > 0 ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'
                                    }`}
                            >
                                <span className="font-semibold">Saldo pendiente</span>
                                <span className="font-bold text-2xl">${invoice.outstandingBalance.toFixed(2)}</span>
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
                    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-semibold text-gray-900">Historial de pagos</h2>
                            {payments && payments.length > 0 && (
                                <span className="text-sm text-gray-500">
                                    {payments.length} {payments.length === 1 ? 'pago' : 'pagos'}
                                </span>
                            )}
                        </div>

                        {loadingPayments ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                <span className="ml-3 text-gray-500">Cargando pagos...</span>
                            </div>
                        ) : payments && payments.length > 0 ? (
                            <div className="space-y-3">
                                {payments.map((payment) => (
                                    <PaymentListItem key={payment.id} payment={payment} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z" />
                                </svg>
                                <p className="text-gray-500 mt-4">
                                    No hay pagos registrados para esta factura
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Columna derecha: Formulario de pago */}
                {canReceivePayment && (
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg shadow-lg border-2 border-blue-100 p-6 sticky top-6 space-y-5">
                            <div className="border-b pb-3">
                                <h2 className="text-xl font-semibold text-gray-900">Registrar pago</h2>
                                <p className="text-sm text-gray-600 mt-1">Complete el formulario para registrar un nuevo pago</p>
                            </div>
                            
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
                            <div className="pt-4 border-t">
                                <Link
                                    to={`/invoices/${invoice.id}/receipt`}
                                    className="flex items-center justify-center gap-2 w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                    Ver versión imprimible
                                </Link>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
