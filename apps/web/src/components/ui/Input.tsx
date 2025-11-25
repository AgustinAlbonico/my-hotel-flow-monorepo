/**
 * Input - Componente de input reutilizable
 * Siguiendo FRONTEND_CHECKLIST.md - Componentes Reutilizables
 */
import React from 'react';
import { cn } from '@/utils/cn';
import { AlertCircle } from 'lucide-react';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      fullWidth = false,
      className,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className={cn('flex flex-col gap-1.5', fullWidth && 'w-full')}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-gray-700"
          >
            {label}
            {props.required && <span className="text-error-600 ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full px-4 py-2 border rounded-md transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-offset-0',
              'placeholder:text-gray-400',
              'disabled:bg-gray-100 disabled:cursor-not-allowed',
              error
                ? 'border-error-500 focus:ring-error-500 focus:border-error-500'
                : 'border-gray-300 focus:ring-primary-500 focus:border-transparent',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              className
            )}
            {...props}
          />

          {rightIcon && !error && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              {rightIcon}
            </div>
          )}

          {error && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-error-500">
              <AlertCircle size={18} />
            </div>
          )}
        </div>

        {error && (
          <p className="text-sm text-error-600 flex items-center gap-1">
            {error}
          </p>
        )}

        {helperText && !error && (
          <p className="text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
