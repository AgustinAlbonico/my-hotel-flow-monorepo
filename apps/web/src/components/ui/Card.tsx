/**
 * Card - Componente de tarjeta reutilizable
 * Siguiendo FRONTEND_CHECKLIST.md - Componentes Reutilizables
 */
import React from 'react';
import { cn } from '@/utils/cn';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export interface CardBodyProps {
  children: React.ReactNode;
  className?: string;
}

export interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export const Card: React.FC<CardProps> & {
  Header: React.FC<CardHeaderProps>;
  Body: React.FC<CardBodyProps>;
  Footer: React.FC<CardFooterProps>;
} = ({ children, className, hoverable = false, padding = 'md' }) => {
  return (
    <div
      className={cn(
        'bg-white rounded-lg shadow-md transition-shadow duration-300',
        hoverable && 'hover:shadow-xl cursor-pointer',
        paddingClasses[padding],
        className
      )}
    >
      {children}
    </div>
  );
};

const CardHeader: React.FC<CardHeaderProps> = ({ children, className }) => {
  return (
    <div className={cn('border-b border-gray-200 pb-4 mb-4', className)}>
      {children}
    </div>
  );
};

const CardBody: React.FC<CardBodyProps> = ({ children, className }) => {
  return <div className={cn(className)}>{children}</div>;
};

const CardFooter: React.FC<CardFooterProps> = ({ children, className }) => {
  return (
    <div className={cn('border-t border-gray-200 pt-4 mt-4', className)}>
      {children}
    </div>
  );
};

Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;
