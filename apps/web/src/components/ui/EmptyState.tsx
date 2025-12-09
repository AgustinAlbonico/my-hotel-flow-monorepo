/**
 * EmptyState - Componente para estados vacíos informativos
 * Siguiendo PLAN_MEJORAS_UI_UX.md - Fase 1: Empty States Mejorados
 */
import React from 'react';
import { Button, ButtonProps } from './Button';
import { cn } from '@/utils/cn';

export interface EmptyStateAction {
  label: string;
  onClick: () => void;
  variant?: ButtonProps['variant'];
  icon?: React.ReactNode;
}

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
  illustration?: string;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  secondaryAction,
  illustration,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 px-4 text-center',
        className
      )}
      role="status"
      aria-live="polite"
    >
      {/* Ilustración opcional */}
      {illustration && (
        <img
          src={illustration}
          alt=""
          className="w-48 h-48 md:w-64 md:h-64 mb-6 opacity-60"
          aria-hidden="true"
        />
      )}

      {/* Ícono */}
      {icon && !illustration && (
        <div
          className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4 text-gray-600 dark:text-gray-400"
          aria-hidden="true"
        >
          {icon}
        </div>
      )}

      {/* Título */}
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{title}</h3>

      {/* Descripción */}
      {description && (
        <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md mb-6">{description}</p>
      )}

      {/* Acciones */}
      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row gap-3 mt-2">
          {action && (
            <Button
              variant={action.variant || 'primary'}
              onClick={action.onClick}
              leftIcon={action.icon}
            >
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              variant={secondaryAction.variant || 'secondary'}
              onClick={secondaryAction.onClick}
              leftIcon={secondaryAction.icon}
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
