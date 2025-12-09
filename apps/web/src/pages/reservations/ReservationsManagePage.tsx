/**
 * ReservationsManagePage
 * Página unificada para gestionar reservas confirmadas.
 * Permite ver, modificar y cancelar reservas desde una única interfaz.
 */
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  BedDouble,
  Calendar,
  ChevronRight,
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

/**
 * Convierte una fecha YYYY-MM-DD a ISO string con hora del mediodía local
 */
const toLocalISOString = (dateStr: string): string => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day, 12, 0, 0);
  return date.toISOString();
};

/**
 * Formatea una fecha ISO a formato local
 */
const formatDate = (dateStr?: string): string => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

/**
 * Calcula la cantidad de noches entre dos fechas
 */
const calculateNights = (checkIn?: string, checkOut?: string): number => {
  if (!checkIn || !checkOut) return 0;
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diff = end.getTime() - start.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

export const ReservationsManagePage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [search, setSearch] = useState('');
  const [selectedReservation, setSelectedReservation] = useState<ReservationListItem | null>(null);
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);

  // Form states for modify
  const [newCheckIn, setNewCheckIn] = useState('');
  const [newCheckOut, setNewCheckOut] = useState('');

  // Form states for cancel
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

  // Mutation para modificar fechas
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

  // Mutation para cancelar
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

  // Ordenar reservas por fecha de check-in (más próxima primero)
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
    if (type === 'cancel') {
      setCancelReason('');
    }
  };

  const handleCloseModal = () => {
    setActiveModal(null);
    setSelectedReservation(null);
    setNewCheckIn('');
    setNewCheckOut('');
    setCancelReason('');
  };

  const handleSubmitModify = () => {
    if (!selectedReservation) return;
    if (!newCheckIn && !newCheckOut) return;

    updateMutation.mutate({
      id: selectedReservation.id,
      checkIn: newCheckIn ? toLocalISOString(newCheckIn) : undefined,
      checkOut: newCheckOut ? toLocalISOString(newCheckOut) : undefined,
    });
  };

  const handleSubmitCancel = () => {
    if (!selectedReservation || !cancelReason.trim()) return;

    cancelMutation.mutate({
      id: selectedReservation.id,
      reason: cancelReason.trim(),
    });
  };

  const minDate = getTodayLocalDate();

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = () => setOpenDropdownId(null);
    if (openDropdownId !== null) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openDropdownId]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-gray-600">
        <button onClick={() => navigate('/')} className="hover:text-primary-600">
          Inicio
        </button>
        <ChevronRight className="inline mx-2" size={14} />
        <button onClick={() => navigate('/reservations')} className="hover:text-primary-600">
          Gestión de Reservas
        </button>
        <ChevronRight className="inline mx-2" size={14} />
        <span className="text-gray-900 font-medium">Administrar Reservas</span>
      </nav>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Administrar Reservas</h1>
        <p className="text-gray-600">
          Visualizá, modificá o cancelá reservas confirmadas. Las reservas están ordenadas por proximidad.
        </p>
      </div>

      {/* Search bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por código de reserva, DNI o nombre del cliente..."
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
          />
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-16 flex flex-col items-center">
          <Loader2 className="animate-spin text-primary-600 mb-4" size={40} />
          <p className="text-gray-600">Cargando reservas confirmadas...</p>
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-start gap-4">
          <AlertCircle className="text-red-600 mt-0.5 flex-shrink-0" size={24} />
          <div>
            <p className="font-semibold text-red-800 mb-1">Error al cargar reservas</p>
            <p className="text-sm text-red-700">
              {error instanceof Error ? error.message : 'Error desconocido.'}
            </p>
          </div>
        </div>
      )}

      {/* Tabla de reservas */}
      {!isLoading && !isError && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {sortedReservations.length === 0 ? (
            <div className="p-16 text-center">
              <Calendar className="mx-auto text-gray-300 mb-4" size={48} />
              <p className="text-gray-600 font-medium mb-1">No hay reservas confirmadas</p>
              <p className="text-sm text-gray-500">
                No se encontraron reservas que coincidan con tu búsqueda.
              </p>
            </div>
          ) : (
            <>
              {/* Header de la tabla */}
              <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
                <p className="text-sm text-gray-600">
                  <span className="font-semibold text-gray-900">{sortedReservations.length}</span>{' '}
                  reserva{sortedReservations.length !== 1 ? 's' : ''} confirmada
                  {sortedReservations.length !== 1 ? 's' : ''}
                </p>
              </div>

              {/* Tabla */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Código
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Cliente
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Habitación
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Check-In
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Check-Out
                      </th>
                      <th className="text-center px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Noches
                      </th>
                      <th className="text-right px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {sortedReservations.map((reservation) => (
                      <tr key={reservation.id} className="hover:bg-gray-50 transition-colors">
                        {/* Código */}
                        <td className="px-6 py-4">
                          <span className="font-mono text-sm font-semibold text-primary-600">
                            {reservation.code || `RES-${reservation.id}`}
                          </span>
                        </td>

                        {/* Cliente */}
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

                        {/* Habitación */}
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

                        {/* Check-In */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="text-green-500" size={16} />
                            <span className="text-sm text-gray-900">
                              {formatDate(reservation.checkIn)}
                            </span>
                          </div>
                        </td>

                        {/* Check-Out */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="text-red-500" size={16} />
                            <span className="text-sm text-gray-900">
                              {formatDate(reservation.checkOut)}
                            </span>
                          </div>
                        </td>

                        {/* Noches */}
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                            {calculateNights(reservation.checkIn, reservation.checkOut)}
                          </span>
                        </td>

                        {/* Acciones */}
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

                            {/* Dropdown menu */}
                            {openDropdownId === reservation.id && (
                              <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                                <button
                                  onClick={() => handleOpenModal(reservation, 'view')}
                                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                >
                                  <Eye size={16} className="text-gray-500" />
                                  Ver detalle
                                </button>
                                <button
                                  onClick={() => handleOpenModal(reservation, 'modify')}
                                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                >
                                  <Edit3 size={16} className="text-blue-500" />
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
      )}

      {/* Modal de Ver Detalle */}
      {activeModal === 'view' && selectedReservation && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={handleCloseModal} />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Detalle de Reserva</h2>
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

              {/* Content */}
              <div className="px-6 py-5 space-y-4">
                {/* Estado */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Estado</span>
                  <span className="px-3 py-1 text-sm rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-medium">
                    Confirmada
                  </span>
                </div>

                {/* Cliente */}
                {selectedReservation.client && (
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <User className="text-gray-600" size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {selectedReservation.client.firstName} {selectedReservation.client.lastName}
                        </p>
                        <p className="text-xs text-gray-500">Cliente</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-gray-500 text-xs">DNI</p>
                        <p className="font-medium text-gray-900">{selectedReservation.client.dni}</p>
                      </div>
                      {selectedReservation.client.email && (
                        <div>
                          <p className="text-gray-500 text-xs">Email</p>
                          <p className="font-medium text-gray-900 truncate">
                            {selectedReservation.client.email}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Habitación */}
                {selectedReservation.room && (
                  <div className="p-4 bg-blue-50 rounded-xl">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <BedDouble className="text-blue-600" size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Habitación {selectedReservation.room.numeroHabitacion}
                        </p>
                        <p className="text-xs text-gray-600">{selectedReservation.room.tipoNombre}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Fechas */}
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <p className="text-xs font-medium text-amber-700 mb-3">Fechas de la estadía</p>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="text-green-600" size={18} />
                      <div>
                        <p className="text-xs text-gray-500">Check-In</p>
                        <p className="font-medium text-gray-900">{formatDate(selectedReservation.checkIn)}</p>
                      </div>
                    </div>
                    <span className="text-gray-400 text-lg">→</span>
                    <div className="flex items-center gap-2">
                      <Calendar className="text-red-600" size={18} />
                      <div>
                        <p className="text-xs text-gray-500">Check-Out</p>
                        <p className="font-medium text-gray-900">{formatDate(selectedReservation.checkOut)}</p>
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500">Noches</p>
                      <p className="font-semibold text-gray-900">
                        {calculateNights(selectedReservation.checkIn, selectedReservation.checkOut)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleCloseModal();
                    handleOpenModal(selectedReservation, 'modify');
                  }}
                  className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 transition-colors"
                >
                  <Edit3 size={16} className="mr-2" />
                  Modificar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Modificar */}
      {activeModal === 'modify' && selectedReservation && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={handleCloseModal} />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Modificar Reserva</h2>
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

              {/* Content */}
              <div className="px-6 py-5 space-y-4">
                {/* Info cards */}
                <div className="grid grid-cols-2 gap-3">
                  {selectedReservation.client && (
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-2 mb-1">
                        <User className="text-gray-500" size={16} />
                        <span className="text-xs font-medium text-gray-500 uppercase">Cliente</span>
                      </div>
                      <p className="text-sm font-medium text-gray-900">
                        {selectedReservation.client.firstName} {selectedReservation.client.lastName}
                      </p>
                      <p className="text-xs text-gray-500">DNI: {selectedReservation.client.dni}</p>
                    </div>
                  )}
                  {selectedReservation.room && (
                    <div className="p-3 bg-blue-50 rounded-xl">
                      <div className="flex items-center gap-2 mb-1">
                        <BedDouble className="text-blue-600" size={16} />
                        <span className="text-xs font-medium text-blue-600 uppercase">Habitación</span>
                      </div>
                      <p className="text-sm font-medium text-gray-900">
                        Hab. {selectedReservation.room.numeroHabitacion}
                      </p>
                      <p className="text-xs text-gray-600">{selectedReservation.room.tipoNombre}</p>
                    </div>
                  )}
                </div>

                {/* Fechas actuales */}
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <p className="text-xs font-medium text-amber-700 mb-2">Fechas actuales</p>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="text-green-600" size={16} />
                      <span className="text-gray-900">{formatDate(selectedReservation.checkIn)}</span>
                    </div>
                    <span className="text-gray-400">→</span>
                    <div className="flex items-center gap-2">
                      <Calendar className="text-red-600" size={16} />
                      <span className="text-gray-900">{formatDate(selectedReservation.checkOut)}</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      ({calculateNights(selectedReservation.checkIn, selectedReservation.checkOut)} noches)
                    </span>
                  </div>
                </div>

                {/* Nuevas fechas */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-3">Nuevas fechas</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">Check-In</label>
                      <input
                        type="date"
                        value={newCheckIn}
                        min={minDate}
                        onChange={(e) => setNewCheckIn(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">Check-Out</label>
                      <input
                        type="date"
                        value={newCheckOut}
                        min={newCheckIn || minDate}
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
              </div>

              {/* Footer */}
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

      {/* Modal de Cancelar */}
      {activeModal === 'cancel' && selectedReservation && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={handleCloseModal} />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl">
              {/* Header */}
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

              {/* Content */}
              <div className="px-6 py-5 space-y-4">
                {/* Warning */}
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

                {/* Info cards */}
                <div className="grid grid-cols-2 gap-3">
                  {selectedReservation.client && (
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-2 mb-1">
                        <User className="text-gray-500" size={16} />
                        <span className="text-xs font-medium text-gray-500 uppercase">Cliente</span>
                      </div>
                      <p className="text-sm font-medium text-gray-900">
                        {selectedReservation.client.firstName} {selectedReservation.client.lastName}
                      </p>
                    </div>
                  )}
                  {selectedReservation.room && (
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-2 mb-1">
                        <BedDouble className="text-gray-500" size={16} />
                        <span className="text-xs font-medium text-gray-500 uppercase">Habitación</span>
                      </div>
                      <p className="text-sm font-medium text-gray-900">
                        Hab. {selectedReservation.room.numeroHabitacion}
                      </p>
                    </div>
                  )}
                </div>

                {/* Fechas */}
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs font-medium text-gray-500 mb-2">Fechas de la reserva</p>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="text-green-600" size={16} />
                      <span className="text-gray-900">{formatDate(selectedReservation.checkIn)}</span>
                    </div>
                    <span className="text-gray-400">→</span>
                    <div className="flex items-center gap-2">
                      <Calendar className="text-red-600" size={16} />
                      <span className="text-gray-900">{formatDate(selectedReservation.checkOut)}</span>
                    </div>
                  </div>
                </div>

                {/* Motivo */}
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

              {/* Footer */}
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

export default ReservationsManagePage;
