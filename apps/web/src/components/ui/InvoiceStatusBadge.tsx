/**
 * Invoice Status Badge Component
 */
import { InvoiceStatus } from '@/types/billing.types';

interface InvoiceStatusBadgeProps {
  status: InvoiceStatus;
}

const statusConfig = {
  [InvoiceStatus.PENDING]: {
    label: 'Pendiente',
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  },
  [InvoiceStatus.PARTIAL]: {
    label: 'Pago Parcial',
    className: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  [InvoiceStatus.PAID]: {
    label: 'Pagada',
    className: 'bg-green-100 text-green-800 border-green-200',
  },
  [InvoiceStatus.CANCELLED]: {
    label: 'Cancelada',
    className: 'bg-gray-100 text-gray-800 border-gray-200',
  },
};

export const InvoiceStatusBadge = ({ status }: InvoiceStatusBadgeProps) => {
  const config = statusConfig[status];

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.className}`}
    >
      {config.label}
    </span>
  );
};
