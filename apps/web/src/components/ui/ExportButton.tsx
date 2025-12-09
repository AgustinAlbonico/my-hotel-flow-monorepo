/**
 * ExportButton - Componente para exportar datos
 * Fase 3 - UI/UX: Botón de exportación con dropdown
 */
import { useState } from 'react';
import { Download, FileText, FileSpreadsheet, File } from 'lucide-react';
import { exportToPDF, exportToExcel, exportToCSV, ExportColumn, ExportOptions } from '@/utils/export';
import { cn } from '@/utils/cn';

interface ExportButtonProps<T> {
  data: T[];
  columns: ExportColumn[];
  filename: string;
  title?: string;
  subtitle?: string;
  className?: string;
  disabled?: boolean;
  formats?: ('pdf' | 'excel' | 'csv')[];
}

export function ExportButton<T extends Record<string, any>>({
  data,
  columns,
  filename,
  title,
  subtitle,
  className,
  disabled = false,
  formats = ['pdf', 'excel', 'csv'],
}: ExportButtonProps<T>) {
  const [isOpen, setIsOpen] = useState(false);

  const handleExport = (format: 'pdf' | 'excel' | 'csv') => {
    const options: ExportOptions = {
      filename,
      title,
      subtitle,
    };

    switch (format) {
      case 'pdf':
        exportToPDF(data, columns, options);
        break;
      case 'excel':
        exportToExcel(data, columns, options);
        break;
      case 'csv':
        exportToCSV(data, columns, options);
        break;
    }

    setIsOpen(false);
  };

  if (data.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg',
          'hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900',
          'text-gray-700 dark:text-gray-300 font-medium text-sm',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          className
        )}
      >
        <Download size={18} />
        <span>Exportar</span>
      </button>

      {isOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20 animate-fade-in">
            <div className="py-1">
              {formats.includes('pdf') && (
                <button
                  onClick={() => handleExport('pdf')}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <FileText size={16} className="text-error-600 dark:text-error-400" />
                  <span>Exportar a PDF</span>
                </button>
              )}

              {formats.includes('excel') && (
                <button
                  onClick={() => handleExport('excel')}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <FileSpreadsheet size={16} className="text-success-600 dark:text-success-400" />
                  <span>Exportar a Excel</span>
                </button>
              )}

              {formats.includes('csv') && (
                <button
                  onClick={() => handleExport('csv')}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <File size={16} className="text-blue-600 dark:text-blue-400" />
                  <span>Exportar a CSV</span>
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
