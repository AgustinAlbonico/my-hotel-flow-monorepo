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
  const invoiceListItem = invoice as InvoiceListItem;

  return (
    <Link
      to={`/invoices/${invoice.id}`}
      className="block bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow p-4"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Factura #{invoice.invoiceNumber}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Reserva #{invoice.reservationId}
            {invoiceListItem.reservation?.code && ` - ${invoiceListItem.reservation.code}`}
          </p>
        </div>
        <InvoiceStatusBadge status={invoice.status} />
      </div>

      {/* Cliente */}
      {(invoiceListItem.client || ('client' in invoice && invoice.client)) && (
        <div className="mb-3 pb-3 border-b border-gray-100 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Cliente</p>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {invoiceListItem.client?.firstName || invoice.client?.firstName}{' '}
            {invoiceListItem.client?.lastName || invoice.client?.lastName}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {invoiceListItem.client?.email || invoice.client?.email}
          </p>
          {invoiceListItem.client?.phone && (
            <p className="text-xs text-gray-500 dark:text-gray-400">📞 {invoiceListItem.client.phone}</p>
          )}
        </div>
      )}

      {/* Información de Estadía */}
      {invoiceListItem.reservation && (
        <div className="mb-3 pb-3 border-b border-gray-100 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Estadía</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <p className="text-gray-500 dark:text-gray-400">Check-in</p>
              <p className="font-medium text-gray-700 dark:text-gray-300">
                {new Date(invoiceListItem.reservation.checkIn).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400">Check-out</p>
              <p className="font-medium text-gray-700 dark:text-gray-300">
                {new Date(invoiceListItem.reservation.checkOut).toLocaleDateString()}
              </p>
            </div>
          </div>
          {invoiceListItem.reservation.room && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                🏠 Habitación {invoiceListItem.reservation.room.number}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {invoiceListItem.reservation.room.type}
                {invoiceListItem.reservation.room.floor && ` • Piso ${invoiceListItem.reservation.room.floor}`}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Montos */}
      {'subtotal' in invoice ? (
        <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
          <div>
            <p className="text-gray-500 dark:text-gray-400">Subtotal</p>
            <p className="font-medium text-gray-900 dark:text-gray-100">${(invoice as Invoice).subtotal.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400">Impuestos</p>
            <p className="font-medium text-gray-900 dark:text-gray-100">${(invoice as Invoice).taxAmount.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400">Total</p>
            <p className="font-bold text-lg text-gray-900 dark:text-gray-100">${invoice.total.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400">Pagado</p>
            <p className="font-medium text-green-600 dark:text-green-400">
              ${invoice.amountPaid.toFixed(2)}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
          <div>
            <p className="text-gray-500 dark:text-gray-400">Total</p>
            <p className="font-bold text-lg text-gray-900 dark:text-gray-100">${invoice.total.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400">Pagado</p>
            <p className="font-medium text-green-600 dark:text-green-400">
              ${invoice.amountPaid.toFixed(2)}
            </p>
          </div>
        </div>
      )}

      {/* Saldo pendiente */}
      {outstandingAmount > 0 && (
        <div
          className={`p-2 rounded ${
            isOverdue ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' : 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
          }`}
        >
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {isOverdue ? '🚨 Vencida' : '⏳ Pendiente'}:{' '}
            <span className={isOverdue ? 'text-red-700 dark:text-red-400' : 'text-yellow-700 dark:text-yellow-400'}>
              ${outstandingAmount.toFixed(2)}
            </span>
          </p>
        </div>
      )}

      {/* Fechas */}
      <div className="mt-3 flex justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>Emitida: {new Date(invoice.issuedAt).toLocaleDateString()}</span>
        <span>
          Vence: {new Date(invoice.dueDate).toLocaleDateString()}
          {isOverdue && <span className="text-red-500 dark:text-red-400 ml-1">(Vencida)</span>}
        </span>
      </div>
    </Link>
  );
};
