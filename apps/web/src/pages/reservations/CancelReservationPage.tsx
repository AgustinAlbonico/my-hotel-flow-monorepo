/**
 * CancelReservationPage
 * Página para buscar y cancelar una reserva existente.
 * Se apoya en el endpoint GET /reservations y PATCH /reservations/:id/cancel.
 */
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Calendar, Loader2, Search, Trash2, User } from 'lucide-react';
import api from '@/api/axios.config';

interface ReservationListItem {
  id: number;
  code?: string;
  status?: string;
  client?: {
    id: number;
    dni: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  room?: {
    id: number;
    numeroHabitacion: string;
    tipoNombre: string;
  } | null;
  checkIn?: string;
  checkOut?: string;
}

interface CancelReservationDto {
  reason: string;
}

export const CancelReservationPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedReservation, setSelectedReservation] = useState<ReservationListItem | null>(null);
  const [reason, setReason] = useState('');
  const [cancelError, setCancelError] = useState<string | null>(null);

  const {
    data,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['reservations', 'cancel', { search }],
    queryFn: async () => {
      const response = await api.get('/reservations', {
        params: {
          status: 'CONFIRMED',
          search: search || undefined,
          page: 1,
          limit: 20,
        },
      });
      const payload = (response.data?.data || response.data || []) as ReservationListItem[];
      return payload;
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (payload: { id: number; dto: CancelReservationDto }) => {
      setCancelError(null);
      await api.patch(`/reservations/${payload.id}/cancel`, payload.dto);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations', 'cancel'] });
      setSelectedReservation(null);
      setReason('');
    },
    onError: (error: any) => {
      const apiMessage =
        error?.response?.data?.error?.message ??
        error?.response?.data?.message ??
        'No se pudo cancelar la reserva. Intenta nuevamente.';

      setCancelError(apiMessage);
    },
  });

  const reservations = useMemo(() => data ?? [], [data]);

  const handleConfirmCancel = () => {
    if (!selectedReservation || !reason.trim()) {
      return;
    }
    cancelMutation.mutate({
      id: selectedReservation.id,
      dto: { reason: reason.trim() },
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-gray-600">
        <button onClick={() => navigate('/')} className="hover:text-primary-600">
          Inicio
        </button>
        <span className="mx-2">/</span>
        <button
          onClick={() => navigate('/reservations')}
          className="hover:text-primary-600"
        >
          Gestión de Reservas
        </button>
        <span className="mx-2">/</span>
        <span className="text-gray-900 font-medium">Cancelar Reserva</span>
      </nav>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Cancelar Reserva</h1>
        <p className="text-gray-600">
          Buscá una reserva confirmada por código, DNI o nombre del cliente para cancelarla.
        </p>
      </div>

      {/* Buscador */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por código de reserva, DNI o nombre del cliente..."
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Lista / estados */}
      {isLoading && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-10 flex flex-col items-center">
          <Loader2 className="animate-spin text-primary-600 mb-3" size={32} />
          <p className="text-gray-600 text-sm">Cargando reservas...</p>
        </div>
      )}

      {isError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="text-red-600 mt-0.5" size={20} />
          <div>
            <p className="text-sm font-semibold text-red-800">
              Error al cargar reservas
            </p>
            <p className="text-xs text-red-700">
              {error instanceof Error ? error.message : 'Ocurrió un error inesperado.'}
            </p>
          </div>
        </div>
      )}

      {!isLoading && !isError && (
        <div className="grid gap-4 md:grid-cols-2">
          {/* Columna izquierda: listado */}
          <div className="space-y-3">
            {reservations.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center text-sm text-gray-600">
                No se encontraron reservas confirmadas para cancelar.
              </div>
            ) : (
              reservations.map((reservation) => (
                <button
                  key={reservation.id}
                  type="button"
                  onClick={() => setSelectedReservation(reservation)}
                  className={`w-full text-left bg-white rounded-lg border shadow-sm p-4 transition ${
                    selectedReservation?.id === reservation.id
                      ? 'border-primary-500 ring-1 ring-primary-200'
                      : 'border-gray-200 hover:border-primary-300'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">
                        Código de reserva
                      </p>
                      <p className="font-mono text-sm font-semibold text-gray-900">
                        {reservation.code || `RES-${reservation.id}`}
                      </p>
                    </div>
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      Confirmada
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <User className="text-gray-400" size={14} />
                      <div>
                        <p className="text-gray-500">Cliente</p>
                        <p className="font-medium text-gray-900 truncate">
                          {reservation.client
                            ? `${reservation.client.firstName} ${reservation.client.lastName}`
                            : `ID ${reservation.clientId}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="text-gray-400" size={14} />
                      <div>
                        <p className="text-gray-500">Check-in</p>
                        <p className="font-medium text-gray-900">
                          {reservation.checkIn
                            ? new Date(reservation.checkIn).toLocaleDateString('es-AR')
                            : '-'}
                        </p>
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Columna derecha: detalle y cancelación */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 flex flex-col h-full">
            {!selectedReservation ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-sm text-gray-600">
                <Trash2 className="text-gray-300 mb-3" size={40} />
                <p>Seleccioná una reserva de la lista para cancelarla.</p>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 mb-1">
                    Reserva {selectedReservation.code || `#${selectedReservation.id}`}
                  </h2>
                  <p className="text-xs text-gray-500">
                    Esta acción marcará la reserva como cancelada según la política de 24 horas.
                  </p>
                </div>
                <div className="space-y-3 text-sm mb-4">
                  <div className="flex items-center gap-2">
                    <User className="text-gray-400" size={16} />
                    <div>
                      <p className="text-gray-500 text-xs">Cliente</p>
                      <p className="font-medium text-gray-900">
                        {selectedReservation.client
                          ? `${selectedReservation.client.firstName} ${selectedReservation.client.lastName}`
                          : `ID ${selectedReservation.clientId}`}
                      </p>
                      {selectedReservation.client?.dni && (
                        <p className="text-xs text-gray-500">
                          DNI: {selectedReservation.client.dni}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="text-gray-400" size={16} />
                    <div>
                      <p className="text-gray-500 text-xs">Fechas</p>
                      <p className="font-medium text-gray-900">
                        {selectedReservation.checkIn
                          ? new Date(selectedReservation.checkIn).toLocaleDateString('es-AR')
                          : '-'}{' '}
                        {' - '}
                        {selectedReservation.checkOut
                          ? new Date(selectedReservation.checkOut).toLocaleDateString('es-AR')
                          : '-'}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Motivo de cancelación (máx. 100 caracteres)
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    maxLength={100}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Ej: Cambio de fechas del huésped, emergencia personal, error en la carga, etc."
                  />
                  <p className="mt-1 text-[11px] text-gray-500 text-right">
                    {reason.length}/100
                  </p>
                </div>
                <div className="mt-auto flex flex-col gap-2 pt-3 border-t border-gray-200">
                  {cancelError && (
                    <p className="text-xs text-red-600 text-right">
                      {cancelError}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500">
                      Esta acción no se puede deshacer y quedará registrada para auditoría.
                    </p>
                    <button
                      type="button"
                      onClick={handleConfirmCancel}
                      disabled={cancelMutation.isPending || !reason.trim()}
                      className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {cancelMutation.isPending ? (
                        <>
                          <Loader2 className="animate-spin mr-2" size={16} />
                          Cancelando...
                        </>
                      ) : (
                        <>
                          <Trash2 className="mr-2" size={16} />
                          Cancelar reserva
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CancelReservationPage;


