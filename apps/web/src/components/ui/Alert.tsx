/**
 * Alert - Componente de alerta reutilizable
 * Siguiendo FRONTEND_CHECKLIST.md - Componentes Reutilizables
 */
import React from 'react';
import { cn } from '@/utils/cn';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  X,
} from 'lucide-react';

export type AlertVariant = 'success' | 'warning' | 'error' | 'info';

export interface AlertProps {
  variant: AlertVariant;
  title?: string;
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

const variantConfig: Record<
  AlertVariant,
  {
    containerClass: string;
    iconClass: string;
    icon: React.ElementType;
  }
> = {
  success: {
    containerClass: 'bg-success-50 border-success-200 text-success-800',
    iconClass: 'text-success-600',
    icon: CheckCircle2,
  },
  warning: {
    containerClass: 'bg-warning-50 border-warning-200 text-warning-800',
    iconClass: 'text-warning-600',
    icon: AlertTriangle,
  },
  error: {
    containerClass: 'bg-error-50 border-error-200 text-error-800',
    iconClass: 'text-error-600',
    icon: XCircle,
  },
  info: {
    containerClass: 'bg-info-50 border-info-200 text-info-800',
    iconClass: 'text-info-600',
    icon: Info,
  },
};

export const Alert: React.FC<AlertProps> = ({
  variant,
  title,
  children,
  onClose,
  className,
}) => {
  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'flex gap-3 p-4 border rounded-lg',
        config.containerClass,
        className
      )}
      role="alert"
    >
      <div className="flex-shrink-0">
        <Icon size={20} className={config.iconClass} />
      </div>

      <div className="flex-1 min-w-0">
        {title && <h3 className="font-semibold mb-1">{title}</h3>}
        <div className="text-sm">{children}</div>
      </div>

      {onClose && (
        <button
          onClick={onClose}
          className="flex-shrink-0 text-current opacity-60 hover:opacity-100 transition-opacity"
          aria-label="Cerrar alerta"
        >
          <X size={18} />
        </button>
      )}
    </div>
  );
};
