/**
 * Check-in Page
 * Página para realizar check-in de reservas confirmadas
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LogIn,
  Calendar,
  User,
  Home,
  ChevronRight,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Search,
  X,
} from 'lucide-react';
import { useConfirmedReservations, useCheckIn } from '@/hooks/useReservations';
import { useToast } from '@/contexts/ToastContext';
import {
  CheckInConfirmModal,
  CheckInReservation,
} from '@/components/modals/CheckInConfirmModal';
import { searchConfirmedReservations } from '@/api/reservations.api';

export const CheckInPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReservation, setSelectedReservation] =
    useState<CheckInReservation | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<CheckInReservation[] | null>(
    null
  );

  // Obtener reservas confirmadas (pendientes de check-in)
  const { data: allReservations, isLoading, error } = useConfirmedReservations();

  // Mutation para realizar check-in
  const checkInMutation = useCheckIn();

  // Búsqueda en tiempo real
  useEffect(() => {
    const performSearch = async () => {
      if (!searchTerm.trim()) {
        setSearchResults(null);
        return;
      }

      setIsSearching(true);
      try {
        const results = await searchConfirmedReservations(searchTerm);
        setSearchResults(results as unknown as CheckInReservation[]);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Error searching reservations:', err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const timeoutId = setTimeout(performSearch, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const handleCheckIn = async ({
    documentsVerified,
  }: {
    documentsVerified?: boolean;
  }) => {
    if (!selectedReservation) return;

    try {
      await checkInMutation.mutateAsync({
        reservationId: selectedReservation.id,
        documentsVerified,
      });

      showToast({
        type: 'success',
        title: 'Check-in exitoso',
        message:
          'El huésped ha sido registrado. La estadía ha comenzado.',
      });

      setSelectedReservation(null);
      setSearchTerm('');
      setSearchResults(null);
    } catch (error: { response?: { data?: { message?: string } } }) {
      showToast({
        type: 'error',
        title: 'Error en check-in',
        message:
          error.response?.data?.message ||
          'No se pudo completar el check-in',
      });
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    setSearchResults(null);
  };

  // Determinar qué reservas mostrar
  const displayReservations: CheckInReservation[] =
    searchResults !== null
      ? searchResults
      : ((allReservations as unknown as CheckInReservation[] | undefined) ?? []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-primary-600" size={48} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-error-50 border-l-4 border-error-500 p-4 rounded-r-md">
          <div className="flex items-start">
            <AlertTriangle className="text-error-500 mt-0.5 mr-3" size={20} />
            <div>
              <h3 className="text-sm font-medium text-error-800">Error al cargar reservas</h3>
              <p className="text-sm text-error-700 mt-1">
                {error instanceof Error ? error.message : 'Error desconocido'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-gray-600">
        <button onClick={() => navigate('/')} className="hover:text-primary-600">
          Inicio
        </button>
        <ChevronRight className="inline mx-2" size={16} />
        <button onClick={() => navigate('/reservations')} className="hover:text-primary-600">
          Gestión de Reservas
        </button>
        <ChevronRight className="inline mx-2" size={16} />
        <span className="text-gray-900 font-medium">Check-in</span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <LogIn className="text-primary-600" size={32} />
          <h1 className="text-4xl font-bold text-gray-900">Check-in de Reservas</h1>
        </div>
        <p className="text-gray-600">
          Selecciona una reserva confirmada para iniciar la estadía del huésped
        </p>
      </div>

      {/* Buscador mejorado */}
      <div className="mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Buscar Reserva
            </h3>
            <p className="text-sm text-gray-600">
              Ingresa el código de reserva, DNI o nombre del cliente
            </p>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Ej: RES-123456, 12345678, Juan Pérez..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-lg"
            />
            {searchTerm && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            )}
          </div>

          {isSearching && (
            <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
              <Loader2 className="animate-spin" size={16} />
              <span>Buscando...</span>
            </div>
          )}

          {searchTerm && searchResults !== null && !isSearching && (
            <div className="mt-3 text-sm text-gray-600">
              {searchResults.length} reserva(s) encontrada(s)
            </div>
          )}
        </div>
      </div>

      {/* Reservas Confirmadas */}
      {displayReservations.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Calendar className="mx-auto text-gray-400 mb-4" size={64} />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {searchTerm ? 'No se encontraron reservas' : 'No hay reservas pendientes de check-in'}
          </h3>
          <p className="text-gray-600 mb-6">
            {searchTerm
              ? 'Intenta con otro término de búsqueda (código, DNI o nombre)'
              : 'No hay reservas confirmadas esperando check-in.'}
          </p>
          <button
            onClick={() => navigate('/reservations')}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Volver a Gestión de Reservas
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {displayReservations.map((reservation: CheckInReservation) => (
            <div
              key={reservation.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold text-gray-900">
                      Reserva #{reservation.code}
                    </h3>
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      Confirmada
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-start gap-2">
                      <User className="text-gray-400 flex-shrink-0 mt-1" size={16} />
                      <div className="min-w-0">
                        <p className="text-gray-500 text-xs mb-1">Cliente</p>
                        {reservation.client ? (
                          <>
                            <p className="font-medium text-gray-900 truncate">
                              {reservation.client.firstName} {reservation.client.lastName}
                            </p>
                            <p className="text-xs text-gray-600">
                              DNI: {reservation.client.dni}
                            </p>
                          </>
                        ) : (
                          <p className="font-medium text-gray-900">
                            ID: {reservation.clientId}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Home className="text-gray-400 flex-shrink-0 mt-1" size={16} />
                      <div className="min-w-0">
                        <p className="text-gray-500 text-xs mb-1">Habitación</p>
                        {reservation.room ? (
                          <>
                            <p className="font-medium text-gray-900">
                              Hab. {reservation.room.numeroHabitacion}
                            </p>
                            <p className="text-xs text-gray-600 truncate">
                              {reservation.room.tipoNombre}
                            </p>
                          </>
                        ) : (
                          <p className="font-medium text-gray-900">
                            ID: {reservation.roomId}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="text-gray-400" size={16} />
                      <div>
                        <p className="text-gray-500">Check-in previsto</p>
                        <p className="font-medium text-gray-900">
                          {new Date(reservation.checkIn).toLocaleDateString('es-AR')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="text-gray-400" size={16} />
                      <div>
                        <p className="text-gray-500">Check-out previsto</p>
                        <p className="font-medium text-gray-900">
                          {new Date(reservation.checkOut).toLocaleDateString('es-AR')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle2 size={16} />
                  <span>
                    Creada el {new Date(reservation.createdAt).toLocaleDateString('es-AR')}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedReservation(reservation)}
                  disabled={checkInMutation.isPending}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2"
                >
                  <LogIn size={18} />
                  Realizar Check-in
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de confirmación */}
      <CheckInConfirmModal
        isOpen={!!selectedReservation}
        onClose={() => setSelectedReservation(null)}
        onConfirm={handleCheckIn}
        reservation={selectedReservation}
        isLoading={checkInMutation.isPending}
      />

    </div>
  );
};
