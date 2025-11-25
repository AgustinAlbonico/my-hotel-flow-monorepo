/**
 * Debt Badge Component - Muestra deuda pendiente del cliente
 */
interface DebtBadgeProps {
  amount: number;
  showZero?: boolean;
}

export const DebtBadge = ({ amount, showZero = false }: DebtBadgeProps) => {
  if (amount === 0 && !showZero) {
    return null;
  }

  const hasDebt = amount > 0;

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${
        hasDebt
          ? 'bg-red-50 text-red-700 border border-red-200'
          : 'bg-green-50 text-green-700 border border-green-200'
      }`}
    >
      <span className="text-base">{hasDebt ? '⚠️' : '✅'}</span>
      <span>
        {hasDebt ? (
          <>
            Deuda: <span className="font-bold">${amount.toFixed(2)}</span>
          </>
        ) : (
          'Sin deudas'
        )}
      </span>
    </div>
  );
};
