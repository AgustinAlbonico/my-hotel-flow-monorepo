/**
 * Badge - Componente de insignia reutilizable
 * Siguiendo FRONTEND_CHECKLIST.md - Componentes Reutilizables
 */
import React from 'react';
import { cn } from '@/utils/cn';

export type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'default';
export type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  className?: string;
  dot?: boolean;
}

const variantClasses: Record<BadgeVariant, string> = {
  success: 'bg-success-100 text-success-700',
  warning: 'bg-warning-100 text-warning-700',
  error: 'bg-error-100 text-error-700',
  info: 'bg-info-100 text-info-700',
  default: 'bg-gray-100 text-gray-700',
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-1.5 text-base',
};

const dotVariantClasses: Record<BadgeVariant, string> = {
  success: 'bg-success-600',
  warning: 'bg-warning-600',
  error: 'bg-error-600',
  info: 'bg-info-600',
  default: 'bg-gray-600',
};

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className,
  dot = false,
}) => {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium rounded-full',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
    >
      {dot && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full',
            dotVariantClasses[variant]
          )}
        />
      )}
      {children}
    </span>
  );
};
