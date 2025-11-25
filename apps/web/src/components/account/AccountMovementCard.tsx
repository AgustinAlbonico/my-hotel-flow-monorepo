/**
 * Account Movement Card Component
 * Tarjeta para mostrar un movimiento de cuenta
 */
import { AccountMovement, MovementType } from '../../types/account-movement.types';
import { MovementTypeBadge } from './MovementTypeBadge';

interface AccountMovementCardProps {
  movement: AccountMovement;
}

export const AccountMovementCard = ({ movement }: AccountMovementCardProps) => {
  const isCharge = movement.type === MovementType.CHARGE;
  const isPayment = movement.type === MovementType.PAYMENT;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <MovementTypeBadge type={movement.type} />
            <span className="text-sm text-gray-500">
              {formatDate(movement.createdAt)}
            </span>
          </div>

          <p className="text-gray-900 font-medium mb-1">
            {movement.description}
          </p>

          {movement.reference && (
            <p className="text-sm text-gray-500">
              Ref: {movement.reference}
            </p>
          )}
        </div>

        <div className="text-right ml-4">
          <p
            className={`text-lg font-bold ${
              isCharge ? 'text-red-600' : isPayment ? 'text-green-600' : 'text-blue-600'
            }`}
          >
            {isCharge ? '+' : isPayment ? '-' : ''}
            {formatCurrency(movement.amount)}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Saldo: {formatCurrency(movement.balance)}
          </p>
        </div>
      </div>
    </div>
  );
};
