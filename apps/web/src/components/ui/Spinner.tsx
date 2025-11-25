/**
 * Spinner - Componente de carga reutilizable
 * Siguiendo FRONTEND_CHECKLIST.md - Componentes Reutilizables
 */
import React from 'react';
import { cn } from '@/utils/cn';
import { Loader2 } from 'lucide-react';

export type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type SpinnerVariant = 'primary' | 'secondary' | 'white';

export interface SpinnerProps {
  size?: SpinnerSize;
  variant?: SpinnerVariant;
  className?: string;
  fullScreen?: boolean;
  text?: string;
}

const sizeClasses: Record<SpinnerSize, number> = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 32,
  xl: 48,
};

const variantClasses: Record<SpinnerVariant, string> = {
  primary: 'text-primary-600',
  secondary: 'text-gray-600',
  white: 'text-white',
};

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  variant = 'primary',
  className,
  fullScreen = false,
  text,
}) => {
  const spinner = (
    <div className="flex flex-col items-center justify-center gap-3">
      <Loader2
        size={sizeClasses[size]}
        className={cn('animate-spin', variantClasses[variant], className)}
      />
      {text && (
        <p className={cn('text-sm font-medium', variantClasses[variant])}>
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-75 z-50">
        {spinner}
      </div>
    );
  }

  return spinner;
};
