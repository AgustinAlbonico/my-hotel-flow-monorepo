/**
 * Input - Componente de input reutilizable
 * Siguiendo FRONTEND_CHECKLIST.md - Componentes Reutilizables
 * Mejorado con feedback visual de validación (PLAN_MEJORAS_UI_UX.md)
 * Fase 2 - UI/UX: Touch targets mejorados (mínimo 44px altura)
 */
import React from 'react';
import { cn } from '@/utils/cn';
import { AlertCircle, CheckCircle } from 'lucide-react';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  showValidation?: boolean;
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
      showValidation = true,
      className,
      id,
      value,
      ...props
    },
    ref
  ) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    const isValid = showValidation && !error && value && String(value).length > 0;
    const hasError = !!error;

    return (
      <div className={cn('flex flex-col gap-1.5', fullWidth && 'w-full')}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {label}
            {props.required && <span className="text-error-600 dark:text-error-400 ml-1" aria-label="requerido">*</span>}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            value={value}
            aria-invalid={hasError}
            aria-describedby={
              hasError ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
            }
            className={cn(
              'w-full px-4 py-3 min-h-[48px] border rounded-md transition-colors',
              'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100',
              'focus:outline-none focus:ring-2 focus:ring-offset-0 dark:focus:ring-offset-gray-900',
              'placeholder:text-gray-400 dark:placeholder:text-gray-500 touch-manipulation',
              'disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed disabled:text-gray-500 dark:disabled:text-gray-400',
              hasError
                ? 'border-error-500 dark:border-error-400 focus:ring-error-500 focus:border-error-500'
                : isValid
                ? 'border-success-500 dark:border-success-400 focus:ring-success-500 focus:border-success-500'
                : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500 focus:border-transparent',
              leftIcon && 'pl-10',
              (rightIcon || hasError || isValid) && 'pr-10',
              className
            )}
            {...props}
          />

          {/* Validation icons */}
          {!rightIcon && isValid && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-success-500" aria-hidden="true">
              <CheckCircle size={18} />
            </div>
          )}

          {!rightIcon && hasError && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-error-500" aria-hidden="true">
              <AlertCircle size={18} />
            </div>
          )}

          {rightIcon && !hasError && !isValid && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true">
              {rightIcon}
            </div>
          )}
        </div>

        {error && (
          <p id={`${inputId}-error`} className="text-sm text-error-600 flex items-center gap-1" role="alert">
            {error}
          </p>
        )}

        {helperText && !error && (
          <p id={`${inputId}-helper`} className="text-sm text-gray-500">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
