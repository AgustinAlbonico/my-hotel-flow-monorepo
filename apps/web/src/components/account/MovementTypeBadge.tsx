/**
 * Movement Type Badge Component
 * Badge para mostrar el tipo de movimiento
 */
import { MovementType } from '../../types/account-movement.types';

interface MovementTypeBadgeProps {
  type: MovementType;
}

export const MovementTypeBadge = ({ type }: MovementTypeBadgeProps) => {
  const config = {
    [MovementType.CHARGE]: {
      label: 'Cargo',
      className: 'bg-red-100 text-red-800',
      icon: '↑',
    },
    [MovementType.PAYMENT]: {
      label: 'Pago',
      className: 'bg-green-100 text-green-800',
      icon: '↓',
    },
    [MovementType.ADJUSTMENT]: {
      label: 'Ajuste',
      className: 'bg-blue-100 text-blue-800',
      icon: '⚡',
    },
  };

  const { label, className, icon } = config[type];

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </span>
  );
};
