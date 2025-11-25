/**
 * Pagination - Componente de paginación reutilizable
 * Siguiendo FRONTEND_CHECKLIST.md - Componentes Reutilizables
 */
import React from 'react';
import { cn } from '@/utils/cn';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showFirstLast?: boolean;
  maxVisible?: number;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  showFirstLast = true,
  maxVisible = 7,
  className,
}) => {
  const getPageNumbers = (): (number | string)[] => {
    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | string)[] = [];
    const leftOffset = Math.floor((maxVisible - 3) / 2);
    const rightOffset = Math.ceil((maxVisible - 3) / 2);

    if (currentPage <= leftOffset + 2) {
      // Near start
      for (let i = 1; i <= maxVisible - 2; i++) {
        pages.push(i);
      }
      pages.push('...');
      pages.push(totalPages);
    } else if (currentPage >= totalPages - rightOffset - 1) {
      // Near end
      pages.push(1);
      pages.push('...');
      for (let i = totalPages - (maxVisible - 3); i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Middle
      pages.push(1);
      pages.push('...');
      for (
        let i = currentPage - leftOffset;
        i <= currentPage + rightOffset;
        i++
      ) {
        pages.push(i);
      }
      pages.push('...');
      pages.push(totalPages);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div
      className={cn('flex items-center justify-center gap-1', className)}
      role="navigation"
      aria-label="Paginación"
    >
      {/* First page */}
      {showFirstLast && (
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className={cn(
            'p-2 rounded-md transition-colors',
            currentPage === 1
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-gray-700 hover:bg-gray-100'
          )}
          aria-label="Primera página"
        >
          <ChevronsLeft size={18} />
        </button>
      )}

      {/* Previous page */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={cn(
          'p-2 rounded-md transition-colors',
          currentPage === 1
            ? 'text-gray-400 cursor-not-allowed'
            : 'text-gray-700 hover:bg-gray-100'
        )}
        aria-label="Página anterior"
      >
        <ChevronLeft size={18} />
      </button>

      {/* Page numbers */}
      {pageNumbers.map((page, index) => {
        if (page === '...') {
          return (
            <span
              key={`ellipsis-${index}`}
              className="px-3 py-2 text-gray-500"
            >
              ...
            </span>
          );
        }

        const pageNumber = page as number;
        const isActive = pageNumber === currentPage;

        return (
          <button
            key={pageNumber}
            onClick={() => onPageChange(pageNumber)}
            className={cn(
              'min-w-[40px] px-3 py-2 rounded-md text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            )}
            aria-label={`Página ${pageNumber}`}
            aria-current={isActive ? 'page' : undefined}
          >
            {pageNumber}
          </button>
        );
      })}

      {/* Next page */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={cn(
          'p-2 rounded-md transition-colors',
          currentPage === totalPages
            ? 'text-gray-400 cursor-not-allowed'
            : 'text-gray-700 hover:bg-gray-100'
        )}
        aria-label="Página siguiente"
      >
        <ChevronRight size={18} />
      </button>

      {/* Last page */}
      {showFirstLast && (
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className={cn(
            'p-2 rounded-md transition-colors',
            currentPage === totalPages
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-gray-700 hover:bg-gray-100'
          )}
          aria-label="Última página"
        >
          <ChevronsRight size={18} />
        </button>
      )}
    </div>
  );
};
