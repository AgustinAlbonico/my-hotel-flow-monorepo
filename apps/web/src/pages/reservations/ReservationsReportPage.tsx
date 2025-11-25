/**
 * ReservationsReportPage
 * Reporte simple de reservas por rango de fechas y estado, basado en ListReservationsUseCase.
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, Calendar, ChevronRight, Loader2, Search } from 'lucide-react';
import { reservationsApi, type ReservationListItem } from '@/api/reservations.api';

export const ReservationsReportPage: React.FC = () => {
  const navigate = useNavigate();
  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [status, setStatus] = useState<string>('CONFIRMED');

  const {
    data,
    isLoading,
    isError,
    error,
  } = useQuery<
    Awaited<ReturnType<typeof reservationsApi.searchReservationsByDate>>
  >({
    queryKey: ['reservations', 'report', { startDate, endDate, status }],
    queryFn: () =>
      reservationsApi.searchReservationsByDate({
        startDate,
        endDate,
        status: status || undefined,
      }),
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-gray-600">
        <button onClick={() => navigate('/')} className="hover:text-primary-600">
          Inicio
        </button>
        <ChevronRight className="inline mx-2" size={14} />
        <button
          onClick={() => navigate('/reservations')}
          className="hover:text-primary-600"
        >
          Gestión de Reservas
        </button>
        <ChevronRight className="inline mx-2" size={14} />
        <span className="text-gray-900 font-medium">Reporte de Reservas</span>
      </nav>

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">
            Reporte de Reservas
          </h1>
          <p className="text-gray-600 text-sm">
            Consultá las reservas por rango de fechas y estado.
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid gap-4 md:grid-cols-4 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Fecha desde
            </label>
            <input
              type="date"
              value={startDate}
              max={endDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Fecha hasta
            </label>
            <input
              type="date"
              value={endDate}
              min={startDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Estado
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Todos</option>
              <option value="CONFIRMED">Confirmada</option>
              <option value="IN_PROGRESS">En curso</option>
              <option value="COMPLETED">Finalizada</option>
              <option value="CANCELLED">Cancelada</option>
            </select>
          </div>
          <div className="flex items-end">
            <div className="flex items-center gap-2 text-primary-700 text-sm">
              <Search size={16} />
              <span>Los resultados se actualizan automáticamente</span>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido */}
      {isLoading && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-10 flex flex-col items-center">
          <Loader2 className="animate-spin text-primary-600 mb-3" size={32} />
          <p className="text-sm text-gray-600">Buscando reservas...</p>
        </div>
      )}

      {isError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3 mb-4">
          <AlertCircle className="text-red-600 mt-0.5" size={18} />
          <div>
            <p className="text-sm font-semibold text-red-800">
              Error al buscar reservas
            </p>
            <p className="text-xs text-red-700">
              {error instanceof Error ? error.message : 'Ocurrió un error inesperado.'}
            </p>
          </div>
        </div>
      )}

      {!isLoading && !isError && data && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Calendar size={16} className="text-primary-600" />
              <span>
                {data.total} reserva{data.total === 1 ? '' : 's'} encontrada
                {data.total === 1 ? '' : 's'}
              </span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Código
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Check-in
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Check-out
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.data.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-6 text-center text-xs text-gray-500"
                    >
                      No se encontraron reservas en el rango seleccionado.
                    </td>
                  </tr>
                ) : (
                  data.data.map((r: ReservationListItem) => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 whitespace-nowrap font-mono text-xs text-gray-900">
                        {r.code || `RES-${r.id}`}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {r.client
                          ? `${r.client.firstName} ${r.client.lastName}`
                          : '-'}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {r.checkIn
                          ? new Date(r.checkIn).toLocaleDateString('es-AR')
                          : '-'}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {r.checkOut
                          ? new Date(r.checkOut).toLocaleDateString('es-AR')
                          : '-'}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {r.status || 'N/A'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReservationsReportPage;


