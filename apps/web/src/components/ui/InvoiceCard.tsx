/**
 * Invoice Card Component - Tarjeta de factura
 */
import { Link } from 'react-router-dom';
import { Invoice, InvoiceListItem } from '@/types/billing.types';
import { InvoiceStatusBadge } from './InvoiceStatusBadge';

type InvoiceLike = Invoice | (InvoiceListItem & { client?: Invoice['client'] });

interface InvoiceCardProps {
  invoice: InvoiceLike;
}

export const InvoiceCard = ({ invoice }: InvoiceCardProps) => {
  const isOverdue = 'isOverdue' in invoice ? invoice.isOverdue : false;
  const outstandingAmount = invoice.outstandingBalance;

  return (
    <Link
      to={`/invoices/${invoice.id}`}
      className="block bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow p-4"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Factura #{invoice.invoiceNumber}
          </h3>
          <p className="text-sm text-gray-500">
            Reserva #{invoice.reservationId}
          </p>
        </div>
        <InvoiceStatusBadge status={invoice.status} />
      </div>

      {/* Cliente (si está populado) */}
      {'client' in invoice && invoice.client && (
        <div className="mb-3">
          <p className="text-sm font-medium text-gray-700">
            {invoice.client.firstName} {invoice.client.lastName}
          </p>
          <p className="text-xs text-gray-500">{invoice.client.email}</p>
        </div>
      )}

      {/* Montos */}
      {'subtotal' in invoice ? (
        <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
          <div>
            <p className="text-gray-500">Subtotal</p>
            <p className="font-medium">${(invoice as Invoice).subtotal.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-gray-500">Impuestos</p>
            <p className="font-medium">${(invoice as Invoice).taxAmount.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-gray-500">Total</p>
            <p className="font-bold text-lg">${invoice.total.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-gray-500">Pagado</p>
            <p className="font-medium text-green-600">
              ${invoice.amountPaid.toFixed(2)}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
          <div>
            <p className="text-gray-500">Total</p>
            <p className="font-bold text-lg">${invoice.total.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-gray-500">Pagado</p>
            <p className="font-medium text-green-600">
              ${invoice.amountPaid.toFixed(2)}
            </p>
          </div>
        </div>
      )}

      {/* Saldo pendiente */}
      {outstandingAmount > 0 && (
        <div
          className={`p-2 rounded ${
            isOverdue ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'
          }`}
        >
          <p className="text-sm font-medium">
            {isOverdue ? '🚨 Vencida' : '⏳ Pendiente'}:{' '}
            <span className={isOverdue ? 'text-red-700' : 'text-yellow-700'}>
              ${outstandingAmount.toFixed(2)}
            </span>
          </p>
        </div>
      )}

      {/* Fechas */}
      <div className="mt-3 flex justify-between text-xs text-gray-500">
        <span>Emitida: {new Date(invoice.issuedAt).toLocaleDateString()}</span>
        <span>
          Vence: {new Date(invoice.dueDate).toLocaleDateString()}
          {isOverdue && <span className="text-red-500 ml-1">(Vencida)</span>}
        </span>
      </div>
    </Link>
  );
};
