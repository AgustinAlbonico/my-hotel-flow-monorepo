/**
 * Table - Componente de tabla reutilizable
 * Siguiendo FRONTEND_CHECKLIST.md - Componentes Reutilizables
 * Fase 2 - UI/UX: Tabla responsive con vista de cards en mobile
 */
import React, { useState, useEffect } from 'react';
import { cn } from '@/utils/cn';
import { ChevronUp, ChevronDown } from 'lucide-react';

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  width?: string;
  mobileLabel?: string; // Label para mostrar en mobile
  hideOnMobile?: boolean; // Ocultar columna en mobile
}

export interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T, index: number) => string | number;
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
  sortKey?: string;
  sortDirection?: 'asc' | 'desc';
  emptyMessage?: string;
  isLoading?: boolean;
  className?: string;
  mobileCardRender?: (item: T, index: number) => React.ReactNode; // Render custom para mobile
}

export function Table<T>({
  data,
  columns,
  keyExtractor,
  onSort,
  sortKey,
  sortDirection,
  emptyMessage = 'No hay datos disponibles',
  isLoading = false,
  className,
  mobileCardRender,
}: TableProps<T>) {
  const [isMobile, setIsMobile] = useState(false);

  // Detectar si estamos en mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleSort = (key: string) => {
    if (!onSort) return;

    const newDirection =
      sortKey === key && sortDirection === 'asc' ? 'desc' : 'asc';
    onSort(key, newDirection);
  };

  const getAlignClass = (align?: 'left' | 'center' | 'right') => {
    switch (align) {
      case 'center':
        return 'text-center';
      case 'right':
        return 'text-right';
      default:
        return 'text-left';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">{emptyMessage}</p>
      </div>
    );
  }

  // Vista mobile con cards
  if (isMobile) {
    if (mobileCardRender) {
      // Usar render custom si está disponible
      return (
        <div className="space-y-3">
          {data.map((item, index) => (
            <div key={keyExtractor(item, index)}>
              {mobileCardRender(item, index)}
            </div>
          ))}
        </div>
      );
    }

    // Vista de cards por defecto
    return (
      <div className="space-y-3">
        {data.map((item, index) => (
          <div
            key={keyExtractor(item, index)}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm active:shadow-md transition-shadow"
          >
            {columns
              .filter((col) => !col.hideOnMobile)
              .map((column) => (
                <div key={column.key} className="mb-3 last:mb-0">
                  <dt className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                    {column.mobileLabel || column.header}
                  </dt>
                  <dd className="text-sm text-gray-900 dark:text-gray-100">
                    {column.render
                      ? column.render(item)
                      : String((item as Record<string, unknown>)[column.key] ?? '')}
                  </dd>
                </div>
              ))}
          </div>
        ))}
      </div>
    );
  }

  // Vista desktop - tabla tradicional
  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
            {columns.map((column) => (
              <th
                key={column.key}
                className={cn(
                  'px-4 py-3 text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider',
                  getAlignClass(column.align),
                  column.sortable && onSort && 'cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-800'
                )}
                style={{ width: column.width }}
                onClick={() => column.sortable && handleSort(column.key)}
              >
                <div className="flex items-center gap-1 justify-between">
                  <span>{column.header}</span>
                  {column.sortable && onSort && (
                    <div className="flex flex-col">
                      <ChevronUp
                        size={14}
                        className={cn(
                          'text-gray-400 dark:text-gray-500',
                          sortKey === column.key && sortDirection === 'asc' && 'text-primary-600'
                        )}
                      />
                      <ChevronDown
                        size={14}
                        className={cn(
                          'text-gray-400 dark:text-gray-500 -mt-1',
                          sortKey === column.key && sortDirection === 'desc' && 'text-primary-600'
                        )}
                      />
                    </div>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr
              key={keyExtractor(item, index)}
              className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={cn(
                    'px-4 py-3 text-sm text-gray-900 dark:text-gray-100',
                    getAlignClass(column.align)
                  )}
                >
                  {column.render
                    ? column.render(item)
                    : String((item as Record<string, unknown>)[column.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
