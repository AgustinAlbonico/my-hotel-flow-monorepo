/**
 * Table - Componente de tabla reutilizable
 * Siguiendo FRONTEND_CHECKLIST.md - Componentes Reutilizables
 */
import React from 'react';
import { cn } from '@/utils/cn';
import { ChevronUp, ChevronDown } from 'lucide-react';

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  width?: string;
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
}: TableProps<T>) {
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
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            {columns.map((column) => (
              <th
                key={column.key}
                className={cn(
                  'px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider',
                  getAlignClass(column.align),
                  column.sortable && onSort && 'cursor-pointer select-none hover:bg-gray-100'
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
                          'text-gray-400',
                          sortKey === column.key && sortDirection === 'asc' && 'text-primary-600'
                        )}
                      />
                      <ChevronDown
                        size={14}
                        className={cn(
                          'text-gray-400 -mt-1',
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
              className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={cn(
                    'px-4 py-3 text-sm text-gray-900',
                    getAlignClass(column.align)
                  )}
                >
                  {column.render
                    ? column.render(item)
                    : (item as Record<string, unknown>)[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
