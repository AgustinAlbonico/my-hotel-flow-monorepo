/**
 * Payment List Item Component - Item de lista de pagos
 */
import { Payment, PaymentListItem as PaymentListItemType } from '@/types/billing.types';
import { PaymentMethodBadge } from './PaymentMethodBadge';

type UnifiedPayment = Payment | (PaymentListItemType & { invoiceId?: number });

interface PaymentListItemProps {
  payment: UnifiedPayment;
}

export const PaymentListItem = ({ payment }: PaymentListItemProps) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <PaymentMethodBadge method={payment.method} />
            <span className="text-xs text-gray-500">
              {new Date(payment.paidAt).toLocaleString()}
            </span>
          </div>
          {payment.reference && (
            <p className="text-sm text-gray-600">
              Ref: <span className="font-mono">{payment.reference}</span>
            </p>
          )}
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-green-600">
            ${payment.amount.toFixed(2)}
          </p>
          {'status' in payment && (
            <p className="text-xs text-gray-500 capitalize">{payment.status.toLowerCase()}</p>
          )}
        </div>
      </div>

      {/* Info adicional */}
      <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-gray-500">
        {'invoiceId' in payment && payment.invoiceId && (
          <span>Factura ID: #{payment.invoiceId}</span>
        )}
      </div>
    </div>
  );
};
