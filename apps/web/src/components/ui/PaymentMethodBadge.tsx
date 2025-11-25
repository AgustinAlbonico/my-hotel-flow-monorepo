/**
 * Payment Method Badge Component
 */
import { PaymentMethod } from '@/types/billing.types';

interface PaymentMethodBadgeProps {
  method: PaymentMethod;
}

const methodConfig = {
  [PaymentMethod.CASH]: {
    label: 'Efectivo',
    icon: '💵',
    className: 'bg-green-50 text-green-700 border-green-200',
  },
  [PaymentMethod.CREDIT_CARD]: {
    label: 'Tarjeta Crédito',
    icon: '💳',
    className: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  [PaymentMethod.DEBIT_CARD]: {
    label: 'Tarjeta Débito',
    icon: '💳',
    className: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  [PaymentMethod.BANK_TRANSFER]: {
    label: 'Transferencia',
    icon: '🏦',
    className: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
  [PaymentMethod.CHECK]: {
    label: 'Cheque',
    icon: '📝',
    className: 'bg-gray-50 text-gray-700 border-gray-200',
  },
  [PaymentMethod.OTHER]: {
    label: 'Otro',
    icon: '➕',
    className: 'bg-gray-50 text-gray-700 border-gray-200',
  },
};

export const PaymentMethodBadge = ({ method }: PaymentMethodBadgeProps) => {
  const config = methodConfig[method];

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.className}`}
    >
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
};
