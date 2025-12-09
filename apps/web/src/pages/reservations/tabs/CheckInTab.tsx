/**
 * Check-in Tab
 * Tab para realizar check-in de reservas confirmadas
 * Adaptado de CheckInPage.tsx
 */
import React, { useState, useEffect } from 'react';
import {
  LogIn,
  Calendar,
  User,
  Home,
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

export const CheckInTab: React.FC = () => {
  const { showToast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReservation, setSelectedReservation] =
    useState<CheckInReservation | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<CheckInReservation[] | null>(
    null
  );

  const { data: allReservations, isLoading, error } = useConfirmedReservations();
  const checkInMutation = useCheckIn();

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
        message: 'El huésped ha sido registrado. La estadía ha comenzado.',
      });

      setSelectedReservation(null);
      setSearchTerm('');
      setSearchResults(null);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      showToast({
        type: 'error',
        title: 'Error en check-in',
        message: err.response?.data?.message || 'No se pudo completar el check-in',
      });
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    setSearchResults(null);
  };

  // Filtrar reservas donde la fecha de hoy esté dentro del rango de check-in y check-out
  const filterReservationsByDateRange = (reservations: CheckInReservation[]): CheckInReservation[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalizar a medianoche para comparación de fechas

    return reservations.filter((reservation) => {
      const checkInDate = new Date(reservation.checkIn);
      const checkOutDate = new Date(reservation.checkOut);
      
      // Normalizar fechas a medianoche
      checkInDate.setHours(0, 0, 0, 0);
      checkOutDate.setHours(0, 0, 0, 0);

      // Solo mostrar si hoy es el día de check-in o posterior (hasta antes del checkout)
      // Esto excluye reservas futuras
      return today >= checkInDate && today < checkOutDate;
    });
  };

  const displayReservations: CheckInReservation[] = filterReservationsByDateRange(
    searchResults !== null
      ? searchResults
      : ((allReservations as unknown as CheckInReservation[] | undefined) ?? [])
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-primary-600" size={48} />
      </div>
    );
  }

  if (error) {
    return (
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
    );
  }

  return (
    <div className="space-y-6">
      {/* Info */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
        <div className="flex items-start">
          <LogIn className="text-blue-600 mt-0.5 mr-3" size={20} />
          <div>
            <h3 className="text-sm font-medium text-blue-800">Check-in de Reservas</h3>
            <p className="text-sm text-blue-700 mt-1">
              Selecciona una reserva confirmada para iniciar la estadía del huésped
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">
            Buscar Reserva
          </h3>
          <p className="text-xs text-gray-600">
            Ingresa el código de reserva, DNI o nombre del cliente
          </p>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Ej: RES-123456, 12345678, Juan Pérez..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          {searchTerm && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {isSearching && (
          <div className="mt-2 flex items-center gap-2 text-xs text-gray-600">
            <Loader2 className="animate-spin" size={14} />
            <span>Buscando...</span>
          </div>
        )}

        {searchTerm && searchResults !== null && !isSearching && (
          <div className="mt-2 text-xs text-gray-600">
            {searchResults.length} reserva(s) encontrada(s)
          </div>
        )}
      </div>

      {/* Reservations List */}
      {displayReservations.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Calendar className="mx-auto text-gray-300 mb-4" size={48} />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {searchTerm ? 'No se encontraron reservas' : 'No hay reservas para check-in hoy'}
          </h3>
          <p className="text-sm text-gray-600">
            {searchTerm
              ? 'Intenta con otro término de búsqueda'
              : 'No hay reservas confirmadas que deban iniciar hoy o que ya deberían haber comenzado.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayReservations.map((reservation: CheckInReservation) => (
            <div
              key={reservation.id}
              className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      #{reservation.code}
                    </h3>
                    <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                      Confirmada
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div className="flex items-start gap-2">
                      <User className="text-gray-400 flex-shrink-0 mt-0.5" size={14} />
                      <div className="min-w-0">
                        <p className="text-gray-500 text-xs">Cliente</p>
                        {reservation.client ? (
                          <>
                            <p className="font-medium text-gray-900 text-xs truncate">
                              {reservation.client.firstName} {reservation.client.lastName}
                            </p>
                            <p className="text-xs text-gray-600">
                              {reservation.client.dni}
                            </p>
                          </>
                        ) : (
                          <p className="font-medium text-gray-900 text-xs">
                            ID: {reservation.clientId}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Home className="text-gray-400 flex-shrink-0 mt-0.5" size={14} />
                      <div className="min-w-0">
                        <p className="text-gray-500 text-xs">Habitación</p>
                        {reservation.room ? (
                          <>
                            <p className="font-medium text-gray-900 text-xs">
                              Hab. {reservation.room.numeroHabitacion}
                            </p>
                            <p className="text-xs text-gray-600 truncate">
                              {reservation.room.roomTypeName || reservation.room.roomTypeCode || 'N/A'}
                            </p>
                          </>
                        ) : (
                          <p className="font-medium text-gray-900 text-xs">
                            ID: {reservation.roomId}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Calendar className="text-gray-400 flex-shrink-0 mt-0.5" size={14} />
                      <div>
                        <p className="text-gray-500 text-xs">Check-in</p>
                        <p className="font-medium text-gray-900 text-xs">
                          {new Date(reservation.checkIn).toLocaleDateString('es-AR')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Calendar className="text-gray-400 flex-shrink-0 mt-0.5" size={14} />
                      <div>
                        <p className="text-gray-500 text-xs">Check-out</p>
                        <p className="font-medium text-gray-900 text-xs">
                          {new Date(reservation.checkOut).toLocaleDateString('es-AR')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <CheckCircle2 size={14} />
                  <span>
                    Creada {new Date(reservation.createdAt).toLocaleDateString('es-AR')}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedReservation(reservation)}
                  disabled={checkInMutation.isPending}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2 text-sm"
                >
                  <LogIn size={16} />
                  Realizar Check-in
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

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

export default CheckInTab;
