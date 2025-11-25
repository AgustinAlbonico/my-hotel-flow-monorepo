import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CalendarRange, RefreshCcw, Filter, AlertCircle, Loader2 } from 'lucide-react';
import { reservationsApi } from '@/api/reservations.api';

const STATUS_OPTIONS = [
  { label: 'Todas', value: '' },
  { label: 'Confirmadas', value: 'CONFIRMED' },
  { label: 'En curso', value: 'IN_PROGRESS' },
  { label: 'Finalizadas', value: 'COMPLETED' },
  { label: 'Canceladas', value: 'CANCELLED' },
];

const STATUS_STYLES: Record<string, string> = {
  CONFIRMED: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-indigo-100 text-indigo-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

interface Props {
  clientId: number;
}

export const ClientReservationHistory = ({ clientId }: Props) => {
  const [status, setStatus] = useState('');

  const { data, isLoading, isError, refetch, isFetching, error } = useQuery({
    queryKey: ['client-reservations', clientId, status],
    queryFn: () =>
      reservationsApi.getReservationsByClient(clientId, {
        status: status || undefined,
        page: 1,
        limit: 20,
      }),
    enabled: Boolean(clientId),
    staleTime: 1000 * 60,
  });

  const totals = useMemo(() => {
    const list = data?.data || [];
    const active = list.filter((item) =>
      ['CONFIRMED', 'IN_PROGRESS'].includes(item.status),
    ).length;
    const lastReservation = list
      .slice()
      .sort((a, b) => new Date(b.checkIn).getTime() - new Date(a.checkIn).getTime())[0];

    return {
      total: data?.pagination?.total ?? list.length,
      active,
      lastReservation,
    };
  }, [data]);

  return (
    <div className="bg-white rounded-lg shadow-md">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-100 px-6 py-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Historial de Reservas</h3>
          <p className="text-sm text-gray-500">Resumen y listado de todas las estadías del cliente.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
            <CalendarRange size={16} className="text-primary-600" />
            <div>
              <p className="text-xs text-gray-500">Total reservas</p>
              <p className="font-semibold text-gray-900">{totals.total}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
            <Filter size={16} className="text-primary-600" />
            <div>
              <p className="text-xs text-gray-500">Activas / futuras</p>
              <p className="font-semibold text-gray-900">{totals.active}</p>
            </div>
          </div>
          {totals.lastReservation && (
            <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
              <CalendarRange size={16} className="text-primary-600" />
              <div>
                <p className="text-xs text-gray-500">Última estadía</p>
                <p className="font-semibold text-gray-900">
                  {new Date(totals.lastReservation.checkIn).toLocaleDateString('es-AR')}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="border-b border-gray-100 px-6 py-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Filtrar por estado:</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <button
          className="inline-flex items-center gap-2 text-sm text-primary-600 hover:text-primary-800"
          onClick={() => void refetch()}
          disabled={isFetching}
        >
          <RefreshCcw size={16} className={isFetching ? 'animate-spin' : ''} />
          Actualizar
        </button>
      </div>

      {isLoading && (
        <div className="px-6 py-10 flex flex-col items-center justify-center text-gray-500">
          <Loader2 className="animate-spin text-primary-600 mb-3" size={32} />
          <p className="text-sm">Cargando historial de reservas...</p>
        </div>
      )}

      {isError && (
        <div className="px-6 py-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="text-red-600" size={18} />
            <div>
              <p className="text-sm font-semibold text-red-800">No se pudo cargar el historial</p>
              <p className="text-xs text-red-700">
                {error instanceof Error ? error.message : 'Reintenta en unos segundos.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {!isLoading && !isError && (data?.data.length ?? 0) === 0 && (
        <div className="px-6 py-10 text-center text-gray-500">
          <p className="text-sm">Este cliente todavía no tiene reservas registradas.</p>
          <p className="text-xs mt-1">
            ¿Necesitás agendar una estadía? Usa el flujo habitual de creación de reservas.
          </p>
        </div>
      )}

      {!isLoading && !isError && (data?.data.length ?? 0) > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Código
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estadía
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Habitación
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data?.data.map((reservation) => (
                <tr key={reservation.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-gray-900">
                    {reservation.code}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-sm text-gray-900">
                      {new Date(reservation.checkIn).toLocaleDateString('es-AR')} {' al '} {new Date(reservation.checkOut).toLocaleDateString('es-AR')}
                    </p>
                    <p className="text-xs text-gray-500">
                      {reservation.totalNights} noche{reservation.totalNights === 1 ? '' : 's'}
                    </p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-sm text-gray-900">
                      {reservation.room?.numeroHabitacion || '-'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {reservation.room?.roomTypeName || reservation.room?.roomTypeCode || 'Tipo no definido'}
                    </p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                        STATUS_STYLES[reservation.status] || 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {statusLabel(reservation.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <p className="text-sm font-semibold text-gray-900">
                      {reservation.totalPrice !== undefined
                        ? new Intl.NumberFormat('es-AR', {
                            style: 'currency',
                            currency: 'ARS',
                            minimumFractionDigits: 2,
                          }).format(reservation.totalPrice)
                        : 'S/D'}
                    </p>
                    <p className="text-xs text-gray-500">Precio estimado</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const statusLabel = (status: string) => {
  switch (status) {
    case 'CONFIRMED':
      return 'Confirmada';
    case 'IN_PROGRESS':
      return 'En curso';
    case 'COMPLETED':
      return 'Finalizada';
    case 'CANCELLED':
      return 'Cancelada';
    default:
      return status;
  }
};

export default ClientReservationHistory;
