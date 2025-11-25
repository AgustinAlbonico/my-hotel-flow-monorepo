/**
 * Button - Componente de botón reutilizable
 * Siguiendo FRONTEND_CHECKLIST.md - Componentes Reutilizables
 */
import React from 'react';
import { cn } from '@/utils/cn';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-primary-600 hover:bg-primary-700 text-white shadow-sm hover:shadow-md focus:ring-primary-500',
  secondary:
    'bg-white hover:bg-gray-50 text-primary-600 border-2 border-primary-600 focus:ring-primary-500',
  ghost:
    'text-gray-700 hover:text-primary-600 hover:bg-gray-100 focus:ring-primary-500',
  danger:
    'bg-error-600 hover:bg-error-700 text-white shadow-sm hover:shadow-md focus:ring-error-500',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          variantClasses[variant],
          sizeClasses[size],
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {isLoading && <Loader2 className="animate-spin" size={18} />}
        {!isLoading && leftIcon && leftIcon}
        {children}
        {!isLoading && rightIcon && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';
