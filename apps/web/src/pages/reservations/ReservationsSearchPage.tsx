import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { searchReservationsByDate, type ReservationListItem } from '../../api/reservations.api';
import { ReservationStatusApi } from '../../types/reservations';

type DateMode = 'day' | 'range';

interface FiltersState {
  mode: DateMode;
  date: string; // para modo 'day'
  startDate: string; // para modo 'range'
  endDate: string; // para modo 'range'
  status: '' | ReservationStatusApi;
}

const formatDateForApi = (date: Date) => format(date, 'yyyy-MM-dd');

export const ReservationsSearchPage = () => {
  const today = new Date();
  const todayStr = formatDateForApi(today);

  const [filters, setFilters] = useState<FiltersState>({
    mode: 'day',
    date: todayStr,
    startDate: todayStr,
    endDate: todayStr,
    status: '',
  });

  const [reservations, setReservations] = useState<ReservationListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const effectiveStartDate =
    filters.mode === 'day' ? filters.date : filters.startDate;
  const effectiveEndDate =
    filters.mode === 'day' ? filters.date : filters.endDate;

  const loadReservations = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data } = await searchReservationsByDate({
        startDate: effectiveStartDate || undefined,
        endDate: effectiveEndDate || undefined,
        status: filters.status || undefined,
      });

      setReservations(data);
    } catch (e: any) {
      setError(e?.message ?? 'Error al cargar reservas');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Cargar reservas del día por defecto
    void loadReservations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    void loadReservations();
  };

  const handleChangeMode = (mode: DateMode) => {
    setFilters((prev) => ({
      ...prev,
      mode,
    }));
  };

  const handleChangeField = (
    field: keyof FiltersState,
    value: string,
  ) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const renderStatusBadge = (status: ReservationStatusApi) => {
    const base =
      'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium';

    const map: Record<ReservationStatusApi, string> = {
      CONFIRMED: 'bg-blue-100 text-blue-800',
      IN_PROGRESS: 'bg-emerald-100 text-emerald-800',
      CANCELLED: 'bg-red-100 text-red-800',
      COMPLETED: 'bg-gray-100 text-gray-800',
    };

    return (
      <span className={`${base} ${map[status] ?? ''}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Buscar reservas
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Filtrá reservas por día o por rango de fechas, estado y datos
          del cliente o habitación.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
      >
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">
              Modo fecha:
            </span>
            <button
              type="button"
              onClick={() => handleChangeMode('day')}
              className={`rounded-md px-3 py-1 text-sm border ${
                filters.mode === 'day'
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-700 border-gray-300'
              }`}
            >
              Día
            </button>
            <button
              type="button"
              onClick={() => handleChangeMode('range')}
              className={`rounded-md px-3 py-1 text-sm border ${
                filters.mode === 'range'
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-700 border-gray-300'
              }`}
            >
              Rango
            </button>
          </div>

          {filters.mode === 'day' ? (
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700">
                Fecha
              </label>
              <input
                type="date"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                value={filters.date}
                onChange={(e) =>
                  handleChangeField('date', e.target.value)
                }
              />
            </div>
          ) : (
            <>
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700">
                  Desde
                </label>
                <input
                  type="date"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                  value={filters.startDate}
                  onChange={(e) =>
                    handleChangeField('startDate', e.target.value)
                  }
                />
              </div>
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700">
                  Hasta
                </label>
                <input
                  type="date"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                  value={filters.endDate}
                  onChange={(e) =>
                    handleChangeField('endDate', e.target.value)
                  }
                />
              </div>
            </>
          )}

          <div className="flex flex-col min-w-[180px]">
            <label className="text-sm font-medium text-gray-700">
              Estado
            </label>
            <select
              className="mt-1 block w-full rounded-md border-gray-300 bg-white py-2 pl-3 pr-10 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
              value={filters.status}
              onChange={(e) =>
                handleChangeField(
                  'status',
                  e.target.value as FiltersState['status'],
                )
              }
            >
              <option value="">Todos</option>
              <option value="CONFIRMED">Confirmadas</option>
              <option value="IN_PROGRESS">En curso</option>
              <option value="COMPLETED">Finalizadas</option>
              <option value="CANCELLED">Canceladas</option>
            </select>
          </div>

          <div className="self-end">
            <button
              type="submit"
              className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              disabled={isLoading}
            >
              {isLoading ? 'Buscando…' : 'Buscar'}
            </button>
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600 mt-2">{error}</p>
        )}
      </form>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Código
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cliente
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Habitación
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Check-in
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Check-out
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Noches
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Importe
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {reservations.length === 0 && !isLoading ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-6 text-center text-sm text-gray-500"
                >
                  No se encontraron reservas con los filtros seleccionados.
                </td>
              </tr>
            ) : (
              reservations.map((reservation) => (
                <tr key={reservation.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm text-gray-900">
                    {reservation.code}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-900">
                    {reservation.client
                      ? `${reservation.client.firstName} ${reservation.client.lastName} (${reservation.client.dni})`
                      : 'Sin datos de cliente'}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-900">
                    {reservation.room
                      ? `${reservation.room.numeroHabitacion} - ${reservation.room.roomTypeName ?? ''}`
                      : 'Sin habitación asignada'}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-900">
                    {new Date(reservation.checkIn).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-900">
                    {new Date(reservation.checkOut).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-900 text-center">
                    {reservation.totalNights}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-900 text-right">
                    {reservation.totalPrice != null
                      ? reservation.totalPrice.toLocaleString('es-AR', {
                          style: 'currency',
                          currency: 'ARS',
                        })
                      : '-'}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-900">
                    {renderStatusBadge(reservation.status)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReservationsSearchPage;
