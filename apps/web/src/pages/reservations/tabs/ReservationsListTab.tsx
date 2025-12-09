/**
 * Reservations List Tab
 * Tab para listar, buscar, modificar y cancelar reservas confirmadas
 * Adaptado de ReservationsManagePage.tsx
 */
import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  BedDouble,
  Calendar,
  Edit3,
  Eye,
  Loader2,
  MoreHorizontal,
  Search,
  User,
  X,
  XCircle,
} from 'lucide-react';
import api from '@/api/axios.config';
import { useToast } from '@/contexts/ToastContext';
import { getTodayLocalDate } from '@/utils/date.utils';

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
    email?: string;
  } | null;
  room?: {
    id: number;
    numeroHabitacion: string;
    tipoNombre: string;
    precioPorNoche?: number;
  } | null;
}

type ModalType = 'view' | 'modify' | 'cancel' | null;

const toLocalISOString = (dateStr: string): string => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day, 12, 0, 0);
  return date.toISOString();
};

const formatDate = (dateStr?: string): string => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const calculateNights = (checkIn?: string, checkOut?: string): number => {
  if (!checkIn || !checkOut) return 0;
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diff = end.getTime() - start.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

export const ReservationsListTab: React.FC = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [search, setSearch] = useState('');
  const [selectedReservation, setSelectedReservation] = useState<ReservationListItem | null>(null);
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);

  const [newCheckIn, setNewCheckIn] = useState('');
  const [newCheckOut, setNewCheckOut] = useState('');
  const [cancelReason, setCancelReason] = useState('');

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['reservations', 'manage', { search }],
    queryFn: async () => {
      const response = await api.get('/reservations', {
        params: {
          status: 'CONFIRMED',
          search: search || undefined,
          page: 1,
          limit: 50,
        },
      });
      return (response.data?.data || response.data || []) as ReservationListItem[];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: { id: number; checkIn?: string; checkOut?: string }) => {
      await api.patch(`/reservations/${payload.id}/dates`, {
        checkIn: payload.checkIn,
        checkOut: payload.checkOut,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations', 'manage'] });
      showToast({
        type: 'success',
        title: 'Reserva modificada',
        message: 'Las fechas de la reserva se actualizaron correctamente.',
      });
      handleCloseModal();
    },
    onError: (error: unknown) => {
      let errorMessage = 'Ocurrió un error al modificar la reserva.';
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string | string[] } } };
        const msg = axiosError.response?.data?.message;
        if (Array.isArray(msg)) {
          errorMessage = msg.join(', ');
        } else if (typeof msg === 'string') {
          errorMessage = msg;
        }
      }
      showToast({
        type: 'error',
        title: 'Error al modificar',
        message: errorMessage,
      });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (payload: { id: number; reason: string }) => {
      await api.patch(`/reservations/${payload.id}/cancel`, { reason: payload.reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations', 'manage'] });
      showToast({
        type: 'success',
        title: 'Reserva cancelada',
        message: 'La reserva fue cancelada correctamente.',
      });
      handleCloseModal();
    },
    onError: (error: unknown) => {
      let errorMessage = 'No se pudo cancelar la reserva.';
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string | string[]; error?: { message?: string } } } };
        const msg = axiosError.response?.data?.message || axiosError.response?.data?.error?.message;
        if (Array.isArray(msg)) {
          errorMessage = msg.join(', ');
        } else if (typeof msg === 'string') {
          errorMessage = msg;
        }
      }
      showToast({
        type: 'error',
        title: 'Error al cancelar',
        message: errorMessage,
      });
    },
  });

  const sortedReservations = useMemo(() => {
    const list = data ?? [];
    return [...list].sort((a, b) => {
      const dateA = a.checkIn ? new Date(a.checkIn).getTime() : Infinity;
      const dateB = b.checkIn ? new Date(b.checkIn).getTime() : Infinity;
      return dateA - dateB;
    });
  }, [data]);

  const handleOpenModal = (reservation: ReservationListItem, type: ModalType) => {
    setSelectedReservation(reservation);
    setActiveModal(type);
    setOpenDropdownId(null);

    if (type === 'modify') {
      setNewCheckIn(reservation.checkIn ? reservation.checkIn.substring(0, 10) : '');
      setNewCheckOut(reservation.checkOut ? reservation.checkOut.substring(0, 10) : '');
    }
  };

  const handleCloseModal = () => {
    setSelectedReservation(null);
    setActiveModal(null);
    setNewCheckIn('');
    setNewCheckOut('');
    setCancelReason('');
  };

  const handleSubmitModify = async () => {
    if (!selectedReservation || (!newCheckIn && !newCheckOut)) return;

    await updateMutation.mutateAsync({
      id: selectedReservation.id,
      checkIn: newCheckIn ? toLocalISOString(newCheckIn) : undefined,
      checkOut: newCheckOut ? toLocalISOString(newCheckOut) : undefined,
    });
  };

  const handleSubmitCancel = async () => {
    if (!selectedReservation || !cancelReason.trim()) return;

    await cancelMutation.mutateAsync({
      id: selectedReservation.id,
      reason: cancelReason,
    });
  };

  const today = getTodayLocalDate();
  const minDate = newCheckIn || today;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-primary-600" size={48} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-error-50 border-l-4 border-error-500 p-4 rounded-r-md">
        <div className="flex items-start">
          <AlertCircle className="text-error-500 mt-0.5 mr-3" size={20} />
          <div>
            <h3 className="text-sm font-medium text-error-800">Error al cargar reservas</h3>
            <p className="text-sm text-error-700 mt-1">
              {error instanceof Error ? error.message : 'Error desconocido'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por código, DNI o nombre de cliente..."
            className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        {sortedReservations.length === 0 ? (
          <div className="p-16 text-center">
            <Calendar className="mx-auto text-gray-300 mb-4" size={48} />
            <p className="text-gray-600 font-medium mb-1">No hay reservas confirmadas</p>
            <p className="text-sm text-gray-500">
              {search ? 'No se encontraron reservas que coincidan con tu búsqueda.' : 'Aún no hay reservas confirmadas en el sistema.'}
            </p>
          </div>
        ) : (
          <>
            <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
              <p className="text-sm text-gray-600">
                <span className="font-semibold text-gray-900">{sortedReservations.length}</span> reserva{sortedReservations.length !== 1 ? 's' : ''} confirmada{sortedReservations.length !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full table-surface">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-800">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Código</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Cliente</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Habitación</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Check-In</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Check-Out</th>
                    <th className="text-center px-6 py-3 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Noches</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {sortedReservations.map((reservation) => (
                    <tr key={reservation.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm font-semibold text-primary-600">
                          {reservation.code || `RES-${reservation.id}`}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {reservation.client ? (
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                              <User className="text-gray-500" size={18} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {reservation.client.firstName} {reservation.client.lastName}
                              </p>
                              <p className="text-xs text-gray-500">DNI: {reservation.client.dni}</p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {reservation.room ? (
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                              <BedDouble className="text-blue-600" size={18} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900">
                                Hab. {reservation.room.numeroHabitacion}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {reservation.room.tipoNombre}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="text-green-500" size={16} />
                          <span className="text-sm text-gray-900">{formatDate(reservation.checkIn)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="text-red-500" size={16} />
                          <span className="text-sm text-gray-900">{formatDate(reservation.checkOut)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                          {calculateNights(reservation.checkIn, reservation.checkOut)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="relative inline-block">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenDropdownId(openDropdownId === reservation.id ? null : reservation.id);
                            }}
                            className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                          >
                            <MoreHorizontal size={20} />
                          </button>

                          {openDropdownId === reservation.id && (
                            <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                              <button
                                onClick={() => handleOpenModal(reservation, 'view')}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                              >
                                <Eye size={16} />
                                Ver detalles
                              </button>
                              <button
                                onClick={() => handleOpenModal(reservation, 'modify')}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                              >
                                <Edit3 size={16} />
                                Modificar fechas
                              </button>
                              <button
                                onClick={() => handleOpenModal(reservation, 'cancel')}
                                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                              >
                                <XCircle size={16} />
                                Cancelar reserva
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* View Modal */}
      {activeModal === 'view' && selectedReservation && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={handleCloseModal} />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Detalles de Reserva</h2>
                  <p className="text-sm text-gray-500">
                    {selectedReservation.code || `RES-${selectedReservation.id}`}
                  </p>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="px-6 py-5 space-y-4">
                {selectedReservation.client && (
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-2 mb-3">
                      <User className="text-gray-500" size={18} />
                      <span className="text-sm font-medium text-gray-700">Cliente</span>
                    </div>
                    <p className="font-medium text-gray-900">
                      {selectedReservation.client.firstName} {selectedReservation.client.lastName}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">DNI: {selectedReservation.client.dni}</p>
                  </div>
                )}

                {selectedReservation.room && (
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-2 mb-3">
                      <BedDouble className="text-gray-500" size={18} />
                      <span className="text-sm font-medium text-gray-700">Habitación</span>
                    </div>
                    <p className="font-medium text-gray-900">Habitación {selectedReservation.room.numeroHabitacion}</p>
                    <p className="text-sm text-gray-600 mt-1">{selectedReservation.room.tipoNombre}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-500 mb-1">Check-In</p>
                    <p className="font-medium text-gray-900">{formatDate(selectedReservation.checkIn)}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-500 mb-1">Check-Out</p>
                    <p className="font-medium text-gray-900">{formatDate(selectedReservation.checkOut)}</p>
                  </div>
                </div>

                <div className="p-4 bg-primary-50 rounded-xl">
                  <p className="text-sm text-primary-600 mb-1">Estadía</p>
                  <p className="text-2xl font-bold text-primary-900">
                    {calculateNights(selectedReservation.checkIn, selectedReservation.checkOut)} noches
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
                <button
                  onClick={handleCloseModal}
                  className="px-5 py-2 rounded-lg text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modify Modal */}
      {activeModal === 'modify' && selectedReservation && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={handleCloseModal} />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Modificar Fechas</h2>
                  <p className="text-sm text-gray-500">
                    {selectedReservation.code || `RES-${selectedReservation.id}`}
                  </p>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="px-6 py-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Check-In</label>
                    <input
                      type="date"
                      value={newCheckIn}
                      min={today}
                      onChange={(e) => setNewCheckIn(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Check-Out</label>
                    <input
                      type="date"
                      value={newCheckOut}
                      min={minDate}
                      onChange={(e) => setNewCheckOut(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>
                {newCheckIn && newCheckOut && (
                  <p className="text-xs text-gray-500 mt-2 text-right">
                    Nueva estadía: {calculateNights(newCheckIn, newCheckOut)} noches
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSubmitModify}
                  disabled={updateMutation.isPending || (!newCheckIn && !newCheckOut)}
                  className="inline-flex items-center px-5 py-2 rounded-lg text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
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
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {activeModal === 'cancel' && selectedReservation && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={handleCloseModal} />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <div>
                  <h2 className="text-lg font-semibold text-red-600">Cancelar Reserva</h2>
                  <p className="text-sm text-gray-500">
                    {selectedReservation.code || `RES-${selectedReservation.id}`}
                  </p>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="px-6 py-5 space-y-4">
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                    <div>
                      <p className="text-sm font-medium text-red-800">
                        ¿Estás seguro de cancelar esta reserva?
                      </p>
                      <p className="text-xs text-red-700 mt-1">
                        Esta acción no se puede deshacer y quedará registrada para auditoría.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Motivo de cancelación <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    maxLength={100}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Ej: Cambio de planes del huésped, emergencia personal, etc."
                  />
                  <p className="mt-1 text-xs text-gray-500 text-right">{cancelReason.length}/100</p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                >
                  Volver
                </button>
                <button
                  type="button"
                  onClick={handleSubmitCancel}
                  disabled={cancelMutation.isPending || !cancelReason.trim()}
                  className="inline-flex items-center px-5 py-2 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {cancelMutation.isPending ? (
                    <>
                      <Loader2 className="animate-spin mr-2" size={16} />
                      Cancelando...
                    </>
                  ) : (
                    <>
                      <XCircle size={16} className="mr-2" />
                      Confirmar cancelación
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReservationsListTab;
