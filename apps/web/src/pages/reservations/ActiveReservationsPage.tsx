/**
 * Active Reservations Page
 * Página para listar reservas activas y realizar check-out
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LogOut,
  Calendar,
  User,
  Home,
  ChevronRight,
  Loader2,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import { useActiveReservations, useCheckOut } from '@/hooks/useReservations';
import { CheckoutWizardModal } from '@/components/modals/CheckoutWizardModal';

interface ActiveReservation {
  id: number;
  code: string;
  clientId: number;
  roomId: number;
  checkIn: string;
  checkOut: string;
  createdAt: string;
  client?: {
    firstName: string;
    lastName: string;
    dni: string;
  };
  room?: {
    numeroHabitacion: string;
    tipoNombre: string;
  };
}

export const ActiveReservationsPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    data: reservations,
    isLoading,
    error,
  } = useActiveReservations();
  const checkOutMutation = useCheckOut();

  const [selectedReservation, setSelectedReservation] =
    useState<ActiveReservation | null>(null);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);

  const handleConfirmCheckOut = async ({
    roomCondition,
    observations,
  }: {
    roomCondition: 'GOOD' | 'REGULAR' | 'NEEDS_DEEP_CLEANING';
    observations?: string;
  }): Promise<void> => {
    if (!selectedReservation) return;
    
    // Ejecutar check-out
    await checkOutMutation.mutateAsync({
      reservationId: selectedReservation.id,
      roomCondition,
      observations,
    });
  };

  const handleCheckoutComplete = () => {
    setSelectedReservation(null);
    setShowCheckoutModal(false);
  };

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

  // Función robusta para formatear fechas
  function formatDate(dateStr: string) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? '-' : d.toLocaleDateString('es-AR');
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
        <span className="text-gray-900 font-medium">Check-out</span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <LogOut className="text-primary-600" size={32} />
          <h1 className="text-4xl font-bold text-gray-900">Check-out de Reservas</h1>
        </div>
        <p className="text-gray-600">
          Selecciona una reserva activa para realizar el check-out y generar la factura
        </p>
      </div>

      {/* Reservas Activas */}
      {!reservations || reservations.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Calendar className="mx-auto text-gray-400 mb-4" size={64} />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No hay reservas activas
          </h3>
          <p className="text-gray-600 mb-6">
            Actualmente no hay huéspedes alojados en el hotel.
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
          {(reservations as ActiveReservation[]).map((reservation) => (
            <div
              key={reservation.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold text-gray-900">
                      Código de reserva: <span className="font-mono text-primary-700">{reservation.code}</span>
                    </h3>
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                      En progreso
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
                        <p className="text-gray-500">Check-in</p>
                        <p className="font-medium text-gray-900">
                          {formatDate(reservation.checkIn)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="text-gray-400" size={16} />
                      <div>
                        <p className="text-gray-500">Check-out previsto</p>
                        <p className="font-medium text-gray-900">
                          {formatDate(reservation.checkOut)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {selectedReservation?.id === reservation.id ? (
                <div className="border-t pt-4 mt-4">
                  <p className="text-sm text-gray-600 text-center">
                    Haga clic en el botón "Confirmar Check-out" a continuación para abrir el asistente de checkout.
                  </p>
                  
                  {/* Botones */}
                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={() => {
                        setShowCheckoutModal(true);
                      }}
                      disabled={checkOutMutation.isPending}
                      className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                      {checkOutMutation.isPending ? (
                        <>
                          <Loader2 className="inline-block animate-spin mr-2" size={20} />
                          Procesando...
                        </>
                      ) : (
                        <>
                          <LogOut className="inline-block mr-2" size={20} />
                          Confirmar Check-out
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setSelectedReservation(null);
                        setShowCheckoutModal(false);
                      }}
                      disabled={checkOutMutation.isPending}
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 font-medium"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-end">
                  <button
                    onClick={() => setSelectedReservation(reservation)}
                    className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
                  >
                    <LogOut className="inline-block mr-2" size={18} />
                    Realizar Check-out
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      {/* Modal Wizard de Checkout */}
      <CheckoutWizardModal
        isOpen={showCheckoutModal && !!selectedReservation}
        onClose={() => {
          setShowCheckoutModal(false);
          setSelectedReservation(null);
        }}
        onComplete={handleCheckoutComplete}
        reservation={selectedReservation && {
          id: selectedReservation.id,
          code: selectedReservation.code,
          client: selectedReservation.client,
          room: selectedReservation.room,
          checkIn: selectedReservation.checkIn,
          checkOut: selectedReservation.checkOut,
        }}
        onCheckOut={handleConfirmCheckOut}
      />
      
      {/* Debug info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-black/80 text-white p-3 rounded text-xs font-mono">
          <div>showCheckoutModal: {String(showCheckoutModal)}</div>
          <div>selectedReservation: {selectedReservation?.code || 'null'}</div>
          <div>isOpen: {String(showCheckoutModal && !!selectedReservation)}</div>
        </div>
      )}
    </div>
  );
};




