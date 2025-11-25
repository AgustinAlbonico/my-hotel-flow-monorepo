/**
 * Invoices List Page - Listado de facturas
 */
import { useState } from 'react';
import { useAllInvoices, useOverdueInvoices } from '@/hooks/useInvoices';
import { InvoiceCard } from '@/components/ui/InvoiceCard';

export const InvoicesPage = () => {
  const [filter, setFilter] = useState<'all' | 'overdue'>('all');

  const {
    data: allInvoices,
    isLoading: isLoadingAll,
    error: errorAll,
  } = useAllInvoices();

  const {
    data: overdueInvoices,
    isLoading: isLoadingOverdue,
    error: errorOverdue,
  } = useOverdueInvoices();

  const isLoading = filter === 'overdue' ? isLoadingOverdue : isLoadingAll;
  const error = filter === 'overdue' ? errorOverdue : errorAll;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Cargando facturas...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">Error al cargar las facturas</p>
      </div>
    );
  }

  const invoices = (filter === 'overdue' ? overdueInvoices : allInvoices) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Facturas</h1>
          <p className="text-gray-600 mt-1">
            Gestión de facturación y cobros
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Todas
          </button>
          <button
            onClick={() => setFilter('overdue')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'overdue'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Vencidas ({invoices.length})
          </button>
        </div>
      </div>

      {/* Lista de facturas */}
      {invoices.length === 0 ? (
        <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <p className="text-gray-500 text-lg">
            {filter === 'overdue'
              ? '✅ No hay facturas vencidas'
              : 'No hay facturas para mostrar'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {invoices.map((invoice) => (
            <InvoiceCard key={invoice.id} invoice={invoice} />
          ))}
        </div>
      )}
    </div>
  );
};
