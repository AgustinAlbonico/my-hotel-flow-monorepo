/**
 * ModifyReservationPage
 * Permite buscar una reserva confirmada y modificar sus fechas (check-in / check-out).
 */
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Calendar, ChevronRight, Loader2, RefreshCcw, Search } from 'lucide-react';
import api from '@/api/axios.config';

interface ReservationListItem {
  id: number;
  code?: string;
  status?: string;
  checkIn?: string;
  checkOut?: string;
  client?: {
    id: number;
    dni: string;
    firstName: string;
    lastName: string;
  } | null;
  room?: {
    id: number;
    numeroHabitacion: string;
    tipoNombre: string;
  } | null;
}

interface UpdateReservationDto {
  checkIn?: string;
  checkOut?: string;
}

export const ModifyReservationPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [selectedReservation, setSelectedReservation] =
    useState<ReservationListItem | null>(null);
  const [newCheckIn, setNewCheckIn] = useState('');
  const [newCheckOut, setNewCheckOut] = useState('');

  const {
    data,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['reservations', 'modify', { search }],
    queryFn: async () => {
      const response = await api.get('/reservations', {
        params: {
          status: 'CONFIRMED',
          search: search || undefined,
          page: 1,
          limit: 20,
        },
      });
      return (response.data?.data || response.data || []) as ReservationListItem[];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: { id: number; dto: UpdateReservationDto }) => {
      await api.patch(`/reservations/${payload.id}/dates`, payload.dto);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations', 'modify'] });
    },
  });

  const reservations = useMemo(() => data ?? [], [data]);

  const handleSelect = (reservation: ReservationListItem) => {
    setSelectedReservation(reservation);
    setNewCheckIn(
      reservation.checkIn
        ? reservation.checkIn.substring(0, 10)
        : '',
    );
    setNewCheckOut(
      reservation.checkOut
        ? reservation.checkOut.substring(0, 10)
        : '',
    );
  };

  const handleSubmit = () => {
    if (!selectedReservation) return;
    if (!newCheckIn && !newCheckOut) return;

    updateMutation.mutate({
      id: selectedReservation.id,
      dto: {
        checkIn: newCheckIn || undefined,
        checkOut: newCheckOut || undefined,
      },
    });
  };

  const minDate = new Date().toISOString().split('T')[0];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
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
        <span className="text-gray-900 font-medium">Modificar Reserva</span>
      </nav>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">
          Modificar Reserva
        </h1>
        <p className="text-gray-600 text-sm">
          Buscá una reserva confirmada y ajustá sus fechas dentro de la
          disponibilidad del sistema.
        </p>
      </div>

      {/* Search bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por código, DNI o nombre del cliente..."
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
            />
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-10 flex flex-col items-center">
          <Loader2 className="animate-spin text-primary-600 mb-3" size={32} />
          <p className="text-sm text-gray-600">Cargando reservas...</p>
        </div>
      )}

      {isError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3 mb-4">
          <AlertCircle className="text-red-600 mt-0.5" size={18} />
          <div>
            <p className="text-sm font-semibold text-red-800">
              Error al cargar reservas
            </p>
            <p className="text-xs text-red-700">
              {error instanceof Error ? error.message : 'Error desconocido.'}
            </p>
          </div>
        </div>
      )}

      {!isLoading && !isError && (
        <div className="grid gap-4 md:grid-cols-2">
          {/* Lista de reservas */}
          <div className="space-y-3">
            {reservations.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-lg p-6 text-center text-sm text-gray-600">
                No se encontraron reservas confirmadas para modificar.
              </div>
            ) : (
              reservations.map((reservation) => (
                <button
                  key={reservation.id}
                  type="button"
                  onClick={() => handleSelect(reservation)}
                  className={`w-full text-left bg-white rounded-lg border shadow-sm p-4 transition ${
                    selectedReservation?.id === reservation.id
                      ? 'border-primary-500 ring-1 ring-primary-200'
                      : 'border-gray-200 hover:border-primary-300'
                  }`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Código</p>
                      <p className="font-mono text-sm font-semibold text-gray-900">
                        {reservation.code || `RES-${reservation.id}`}
                      </p>
                    </div>
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      Confirmada
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Calendar className="text-gray-400" size={14} />
                    <span>
                      {reservation.checkIn
                        ? new Date(reservation.checkIn).toLocaleDateString('es-AR')
                        : '-'}{' '}
                      {' - '}
                      {reservation.checkOut
                        ? new Date(reservation.checkOut).toLocaleDateString('es-AR')
                        : '-'}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Panel de edición */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 flex flex-col">
            {!selectedReservation ? (
              <div className="flex-1 flex flex-col items-center justify-center text-sm text-gray-600 text-center">
                <Calendar className="text-gray-300 mb-3" size={40} />
                <p>Seleccioná una reserva para modificar sus fechas.</p>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 mb-1">
                    Fechas de la reserva
                  </h2>
                  <p className="text-xs text-gray-500">
                    Ajustá las fechas dentro de la disponibilidad. El sistema
                    validará que no haya superposición con otras reservas.
                  </p>
                </div>
                <div className="grid gap-4 md:grid-cols-2 mb-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Nuevo check-in
                    </label>
                    <input
                      type="date"
                      value={newCheckIn}
                      min={minDate}
                      onChange={(e) => setNewCheckIn(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Nuevo check-out
                    </label>
                    <input
                      type="date"
                      value={newCheckOut}
                      min={newCheckIn || minDate}
                      onChange={(e) => setNewCheckOut(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="mt-auto flex items-center justify-between pt-3 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      if (!selectedReservation) return;
                      handleSelect(selectedReservation);
                    }}
                    className="inline-flex items-center text-xs text-gray-600 hover:text-gray-800"
                  >
                    <RefreshCcw className="mr-1" size={14} />
                    Restablecer fechas originales
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={
                      updateMutation.isPending || (!newCheckIn && !newCheckOut)
                    }
                    className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {updateMutation.isPending ? (
                      <>
                        <Loader2 className="animate-spin mr-2" size={16} />
                        Guardando...
                      </>
                    ) : (
                      'Guardar cambios'
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ModifyReservationPage;


