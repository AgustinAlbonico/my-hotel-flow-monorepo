/**
 * Payment Form Component - Formulario para registrar pagos
 */
import { useState } from 'react';
import { PaymentMethod } from '@/types/billing.types';
import { PaymentMethodBadge } from './PaymentMethodBadge';

interface PaymentFormProps {
  invoiceId: string;
  outstandingAmount: number;
  onSubmit: (data: {
    amount: number;
    method: PaymentMethod;
    reference?: string;
  }) => void;
  isLoading?: boolean;
  onMethodChange?: (method: PaymentMethod) => void;
  initialMethod?: PaymentMethod;
}

// Métodos habilitados: efectivo, transferencia, débito, crédito
const paymentMethods = [
  PaymentMethod.CASH,
  PaymentMethod.BANK_TRANSFER,
  PaymentMethod.DEBIT_CARD,
  PaymentMethod.CREDIT_CARD,
];

export const PaymentForm = ({
  outstandingAmount,
  onSubmit,
  isLoading = false,
  onMethodChange,
  initialMethod,
}: PaymentFormProps) => {
  const [amount, setAmount] = useState(outstandingAmount.toString());
  const [method, setMethod] = useState<PaymentMethod>(initialMethod ?? PaymentMethod.CASH);
  const [reference, setReference] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);

    if (numAmount <= 0 || numAmount > outstandingAmount) {
      alert(`El monto debe ser mayor a $0 y no mayor a $${outstandingAmount.toFixed(2)}`);
      return;
    }

    onSubmit({
      amount: numAmount,
      method,
      reference: reference.trim() || undefined,
    });
  };

  const setFullAmount = () => {
    setAmount(outstandingAmount.toFixed(2));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Monto pendiente */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-700 mb-1">Saldo pendiente</p>
        <p className="text-2xl font-bold text-blue-900">
          ${outstandingAmount.toFixed(2)}
        </p>
      </div>

      {/* Monto del pago */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Monto a pagar *
        </label>
        <div className="flex gap-2">
          <input
            type="number"
            step="0.01"
            min="0.01"
            max={outstandingAmount}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            disabled={isLoading}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            placeholder="0.00"
          />
          <button
            type="button"
            onClick={setFullAmount}
            disabled={isLoading}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
          >
            Total
          </button>
        </div>
      </div>

      {/* Método de pago */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Método de pago *
        </label>
        <div className="grid grid-cols-2 gap-2">
          {paymentMethods.map((pm) => (
            <button
              key={pm}
              type="button"
              onClick={() => {
                setMethod(pm);
                onMethodChange?.(pm);
              }}
              disabled={isLoading}
              className={`p-3 rounded-lg border-2 transition-all ${
                method === pm
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              } disabled:opacity-50`}
            >
              <PaymentMethodBadge method={pm} />
            </button>
          ))}
        </div>
      </div>

      {/* Referencia */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Referencia / Comprobante (opcional)
        </label>
        <input
          type="text"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          disabled={isLoading}
          maxLength={100}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
          placeholder="Ej: Transferencia #123456, Cheque 00789"
        />
      </div>

      {/* Botón */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? 'Procesando...' : 'Registrar Pago'}
      </button>
    </form>
  );
};
