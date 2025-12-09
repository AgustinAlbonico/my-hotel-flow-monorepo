/**
 * Skeleton - Componente de carga con efecto shimmer
 * Siguiendo PLAN_MEJORAS_UI_UX.md - Fase 1: Loading States
 */
import React from 'react';
import { cn } from '@/utils/cn';

export type SkeletonVariant = 'text' | 'circle' | 'rect';

export interface SkeletonProps {
  variant?: SkeletonVariant;
  width?: string | number;
  height?: string | number;
  className?: string;
}

const variantClasses: Record<SkeletonVariant, string> = {
  text: 'h-4 rounded',
  circle: 'rounded-full',
  rect: 'rounded-md',
};

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'text',
  width,
  height,
  className,
}) => {
  return (
    <div
      className={cn(
        'animate-pulse bg-gradient-to-r from-gray-200 dark:from-gray-700 via-gray-100 dark:via-gray-600 to-gray-200 dark:to-gray-700 bg-[length:200%_100%]',
        variantClasses[variant],
        className
      )}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        animation: 'shimmer 2s infinite',
      }}
      aria-hidden="true"
    />
  );
};

// Skeleton Presets para casos comunes

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="space-y-3" role="status" aria-label="Cargando datos...">
      {/* Header */}
      <div className="flex gap-4 pb-3 border-b border-gray-200 dark:border-gray-700">
        <Skeleton width="20%" height="16px" />
        <Skeleton width="25%" height="16px" />
        <Skeleton width="20%" height="16px" />
        <Skeleton width="20%" height="16px" />
        <Skeleton width="15%" height="16px" />
      </div>
      
      {/* Rows */}
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="flex gap-4 items-center">
          <Skeleton width="20%" height="40px" />
          <Skeleton width="25%" height="40px" />
          <Skeleton width="20%" height="40px" />
          <Skeleton width="20%" height="40px" />
          <Skeleton width="15%" height="40px" />
        </div>
      ))}
      <span className="sr-only">Cargando tabla...</span>
    </div>
  );
};

export const CardSkeleton: React.FC = () => {
  return (
    <div className="card p-6 space-y-4" role="status" aria-label="Cargando tarjeta...">
      <div className="flex items-center justify-between">
        <Skeleton width="60%" height="24px" />
        <Skeleton variant="circle" width="40px" height="40px" />
      </div>
      <Skeleton width="100%" height="16px" />
      <Skeleton width="80%" height="16px" />
      <div className="pt-4">
        <Skeleton width="120px" height="40px" variant="rect" />
      </div>
      <span className="sr-only">Cargando contenido...</span>
    </div>
  );
};

export const CardGridSkeleton: React.FC<{ cards?: number }> = ({ cards = 6 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(cards)].map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
};

export const FormSkeleton: React.FC = () => {
  return (
    <div className="space-y-6" role="status" aria-label="Cargando formulario...">
      {/* Campo 1 */}
      <div className="space-y-2">
        <Skeleton width="120px" height="16px" />
        <Skeleton width="100%" height="40px" variant="rect" />
      </div>
      
      {/* Campo 2 */}
      <div className="space-y-2">
        <Skeleton width="100px" height="16px" />
        <Skeleton width="100%" height="40px" variant="rect" />
      </div>
      
      {/* Grid de campos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Skeleton width="80px" height="16px" />
          <Skeleton width="100%" height="40px" variant="rect" />
        </div>
        <div className="space-y-2">
          <Skeleton width="90px" height="16px" />
          <Skeleton width="100%" height="40px" variant="rect" />
        </div>
      </div>
      
      {/* Botones */}
      <div className="flex gap-3 pt-4">
        <Skeleton width="120px" height="44px" variant="rect" />
        <Skeleton width="100px" height="44px" variant="rect" />
      </div>
      <span className="sr-only">Cargando formulario...</span>
    </div>
  );
};

export const ListSkeleton: React.FC<{ items?: number }> = ({ items = 5 }) => {
  return (
    <div className="space-y-3" role="status" aria-label="Cargando lista...">
      {[...Array(items)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <Skeleton variant="circle" width="48px" height="48px" />
          <div className="flex-1 space-y-2">
            <Skeleton width="40%" height="20px" />
            <Skeleton width="70%" height="16px" />
          </div>
          <Skeleton width="80px" height="32px" variant="rect" />
        </div>
      ))}
      <span className="sr-only">Cargando elementos...</span>
    </div>
  );
};
