/**
 * Invoice Receipt Printable Page
 * Página limpia para imprimir el recibo / estado de factura y pagos.
 */
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useInvoice } from '@/hooks/useInvoices';
import { useInvoicePayments } from '@/hooks/usePayments';
import { PaymentMethodBadge } from '@/components/ui/PaymentMethodBadge';

export const InvoiceReceiptPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const invoiceId = parseInt(id || '0');
  const { data: invoice, isLoading: loadingInvoice } = useInvoice(invoiceId);
  const { data: payments, isLoading: loadingPayments } = useInvoicePayments(invoiceId);

  const handlePrint = () => {
    window.print();
  };

  if (loadingInvoice) {
    return <div className="p-8 text-sm text-gray-500">Cargando factura...</div>;
  }

  if (!invoice) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 font-medium mb-2">Factura no encontrada</p>
          <button
            onClick={() => navigate('/invoices')}
            className="text-blue-600 hover:underline text-sm"
          >
            ← Volver al listado
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-8 bg-white">
      {/* Encabezado del hotel (hardcode inicial, mover a config futura) */}
      <div className="flex justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">MyHotelFlow</h1>
          <p className="text-xs text-gray-600">Dirección del Hotel • Tel: (000) 123-456 • Email: info@hotel.com</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium">Recibo / Factura</p>
          <p className="text-lg font-bold">#{invoice.invoiceNumber}</p>
          <p className="text-xs text-gray-500">Reserva #{invoice.reservationId}</p>
        </div>
      </div>

      {/* Datos del cliente */}
      <div className="mb-6 grid grid-cols-2 gap-4 text-sm">
        <div className="space-y-1">
          <p className="font-semibold">Cliente</p>
          {invoice.client ? (
            <>
              <p>{invoice.client.firstName} {invoice.client.lastName}</p>
              <p className="text-gray-600 text-xs">Email: {invoice.client.email}</p>
            </>
          ) : (
            <p>ID Cliente: {invoice.clientId}</p>
          )}
        </div>
        <div className="space-y-1">
          <p className="font-semibold">Fechas</p>
          <p>Emitida: {new Date(invoice.issuedAt).toLocaleDateString()}</p>
          <p>Vence: {new Date(invoice.dueDate).toLocaleDateString()}</p>
        </div>
      </div>

      {/* Totales */}
      <div className="mb-8 border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <tbody>
            <tr className="border-b">
              <td className="p-3 text-gray-600">Subtotal</td>
              <td className="p-3 text-right font-medium">${invoice.subtotal.toFixed(2)}</td>
            </tr>
            <tr className="border-b">
              <td className="p-3 text-gray-600">Impuestos {(invoice.taxRate * 100).toFixed(0)}%</td>
              <td className="p-3 text-right font-medium">${invoice.taxAmount.toFixed(2)}</td>
            </tr>
            <tr className="bg-gray-50">
              <td className="p-3 font-semibold">Total</td>
              <td className="p-3 text-right font-bold">${invoice.total.toFixed(2)}</td>
            </tr>
            <tr>
              <td className="p-3 text-green-700">Pagado</td>
              <td className="p-3 text-right text-green-700 font-medium">${invoice.amountPaid.toFixed(2)}</td>
            </tr>
            <tr>
              <td className="p-3 font-semibold ${invoice.outstandingBalance > 0 ? 'text-red-600' : 'text-green-600'}">Saldo Pendiente</td>
              <td className="p-3 text-right font-bold ${invoice.outstandingBalance > 0 ? 'text-red-600' : 'text-green-600'}">${invoice.outstandingBalance.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Pagos */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-2">Pagos</h2>
        {loadingPayments ? (
          <p className="text-gray-500 text-sm">Cargando pagos...</p>
        ) : !payments || payments.length === 0 ? (
          <p className="text-gray-500 text-sm">No hay pagos registrados.</p>
        ) : (
          <div className="border border-gray-200 rounded-lg divide-y">
            {payments.map(p => (
              <div key={p.id} className="p-3 flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <PaymentMethodBadge method={p.method} />
                  <span className="text-gray-600">{new Date(p.paidAt).toLocaleString()}</span>
                  {p.reference && (
                    <span className="text-[11px] text-gray-500">Ref: {p.reference}</span>
                  )}
                </div>
                <div className="font-medium">${p.amount.toFixed(2)}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Notas */}
      {invoice.notes && (
        <div className="mb-8 text-sm">
          <p className="font-semibold mb-1">Notas</p>
          <p className="text-gray-700 whitespace-pre-line">{invoice.notes}</p>
        </div>
      )}

      {/* Firma / cierre */}
      <div className="mt-12 grid grid-cols-2 gap-8 text-xs">
        <div className="border-t pt-4">Firma Cliente</div>
        <div className="border-t pt-4 text-right">Emitido automáticamente por el sistema</div>
      </div>

      {/* Botones acción (no aparecen en impresión gracias a @media print) */}
      <div className="mt-8 flex gap-3 print:hidden">
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
        >
          ← Volver
        </button>
        <button
          onClick={handlePrint}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          Imprimir / Guardar PDF
        </button>
      </div>
    </div>
  );
};

export default InvoiceReceiptPage;