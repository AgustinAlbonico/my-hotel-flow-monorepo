/**
 * Breadcrumb - Componente de navegación breadcrumb unificado
 * Siguiendo PLAN_MEJORAS_UI_UX.md - Fase 1: Breadcrumbs Unificados
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface BreadcrumbItem {
  label: string;
  path?: string;
  icon?: React.ReactNode;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
  showHomeIcon?: boolean;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({
  items,
  className,
  showHomeIcon = true,
}) => {
  const navigate = useNavigate();

  const handleNavigate = (path?: string) => {
    if (path) {
      navigate(path);
    }
  };

  return (
    <nav
      className={cn('mb-6 text-sm text-gray-600 dark:text-gray-400', className)}
      aria-label="Breadcrumb"
    >
      <ol className="flex items-center flex-wrap gap-2">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const isClickable = !isLast && item.path;

          return (
            <li key={index} className="flex items-center">
              {/* Separator */}
              {index > 0 && (
                <ChevronRight
                  className="mx-2 text-gray-400 flex-shrink-0"
                  size={14}
                  aria-hidden="true"
                />
              )}

              {/* Item */}
              {isLast ? (
                <span
                  className="text-gray-900 dark:text-gray-100 font-medium flex items-center gap-1.5"
                  aria-current="page"
                >
                  {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
                  {index === 0 && showHomeIcon && !item.icon && (
                    <Home size={14} className="flex-shrink-0" aria-hidden="true" />
                  )}
                  <span>{item.label}</span>
                </span>
              ) : (
                <button
                  onClick={() => handleNavigate(item.path)}
                  className={cn(
                    'flex items-center gap-1.5 transition-colors',
                    isClickable
                      ? 'hover:text-primary-600 cursor-pointer focus:outline-none focus:text-primary-600 focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 rounded px-1 -mx-1'
                      : 'cursor-default'
                  )}
                  disabled={!isClickable}
                  type="button"
                  aria-label={`Navegar a ${item.label}`}
                >
                  {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
                  {index === 0 && showHomeIcon && !item.icon && (
                    <Home size={14} className="flex-shrink-0" aria-hidden="true" />
                  )}
                  <span>{item.label}</span>
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
