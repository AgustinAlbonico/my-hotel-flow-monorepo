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
  CheckCircle2,
} from 'lucide-react';
import { useActiveReservations, useCheckOut } from '@/hooks/useReservations';
import { useToast } from '@/contexts/ToastContext';
import { CheckOutConfirmModal } from '@/components/modals/CheckOutConfirmModal';
import { Modal } from '@/components/ui/Modal';
import { PaymentForm } from '@/components/ui/PaymentForm';
import { generateInvoice } from '@/api/invoices.api';
import { registerPayment } from '@/api/payments.api';
import type { Invoice } from '@/types/billing.types';
import { PaymentMethod } from '@/types/billing.types';
import { MercadoPagoButton } from '@/components/payment/MercadoPagoButton';

interface ApiErrorLike {
  response?: {
    data?: {
      message?: string;
    };
  };
}

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
  const { showToast } = useToast();
  const {
    data: reservations,
    isLoading,
    error,
  } = useActiveReservations();
  const checkOutMutation = useCheckOut();

  const [selectedReservation, setSelectedReservation] =
    useState<ActiveReservation | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [roomCondition, setRoomCondition] = useState<'GOOD' | 'REGULAR' | 'NEEDS_DEEP_CLEANING'>('GOOD');
  const [observations, setObservations] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [generatedInvoice, setGeneratedInvoice] = useState<Invoice | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);

  const handleConfirmCheckOut = async ({
    roomCondition,
    observations,
  }: {
    roomCondition: 'GOOD' | 'REGULAR' | 'NEEDS_DEEP_CLEANING';
    observations?: string;
  }): Promise<void> => {
    if (!selectedReservation) return;
    try {
      // 1) Ejecutar check-out
      await checkOutMutation.mutateAsync({
        reservationId: selectedReservation.id,
        roomCondition,
        observations,
      });

      // 2) Generar factura
      const invoice = await generateInvoice(selectedReservation.id);
      setGeneratedInvoice(invoice);

      showToast({
        type: 'success',
        title: 'Check-out exitoso',
        message: 'Se generó la factura. Podés registrar el pago ahora.',
      });

      // 3) Cerrar confirm modal y abrir pago
      setShowConfirmModal(false);
      setSelectedPaymentMethod(PaymentMethod.CASH);
      setShowPaymentModal(true);
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Error en check-out',
        message:
          (err as ApiErrorLike).response?.data?.message ||
          'No se pudo completar el check-out',
      });
    }
  };

  const handleRegisterPayment = async ({
    amount,
    method,
    reference,
  }: {
    amount: number;
    method: PaymentMethod;
    reference?: string;
  }): Promise<void> => {
    if (!generatedInvoice || !selectedReservation) return;
    try {
      await registerPayment({
        invoiceId: generatedInvoice.id,
        clientId: selectedReservation.clientId,
        amount,
        method,
        reference,
      });

      showToast({
        type: 'success',
        title: 'Pago registrado',
        message: 'El pago se registró correctamente.',
      });

      setShowPaymentModal(false);
      setGeneratedInvoice(null);
      setSelectedReservation(null);
      setRoomCondition('GOOD');
      setObservations('');
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Error al registrar pago',
        message:
          (err as ApiErrorLike).response?.data?.message ||
          'No se pudo registrar el pago',
      });
    }
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
                  <h4 className="font-semibold text-gray-900 mb-4">
                    Detalles del Check-out
                  </h4>
                  
                  {/* Condición de la habitación */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Condición de la habitación
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      <button
                        onClick={() => setRoomCondition('GOOD')}
                        className={`p-3 border-2 rounded-lg text-center transition-colors ${
                          roomCondition === 'GOOD'
                            ? 'border-green-500 bg-green-50 text-green-800'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <CheckCircle2 className="mx-auto mb-1" size={20} />
                        <p className="text-sm font-medium">Buena</p>
                      </button>
                      <button
                        onClick={() => setRoomCondition('REGULAR')}
                        className={`p-3 border-2 rounded-lg text-center transition-colors ${
                          roomCondition === 'REGULAR'
                            ? 'border-yellow-500 bg-yellow-50 text-yellow-800'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <AlertTriangle className="mx-auto mb-1" size={20} />
                        <p className="text-sm font-medium">Regular</p>
                      </button>
                      <button
                        onClick={() => setRoomCondition('NEEDS_DEEP_CLEANING')}
                        className={`p-3 border-2 rounded-lg text-center transition-colors ${
                          roomCondition === 'NEEDS_DEEP_CLEANING'
                            ? 'border-error-500 bg-error-50 text-error-800'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <AlertTriangle className="mx-auto mb-1" size={20} />
                        <p className="text-sm font-medium">Necesita limpieza profunda</p>
                      </button>
                    </div>
                  </div>

                  {/* Observaciones */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Observaciones (opcional)
                    </label>
                    <textarea
                      value={observations}
                      onChange={(e) => setObservations(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      rows={3}
                      placeholder="Ingrese cualquier observación sobre el estado de la habitación..."
                    />
                  </div>

                  {/* Botones */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowConfirmModal(true)}
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
                        setRoomCondition('GOOD');
                        setObservations('');
                        setShowConfirmModal(false);
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
      {/* Modal Confirmar Check-out */}
      <CheckOutConfirmModal
        isOpen={showConfirmModal && !!selectedReservation}
        onClose={() => setShowConfirmModal(false)}
        isLoading={checkOutMutation.isPending}
        onConfirm={handleConfirmCheckOut}
        reservation={selectedReservation && {
          _id: selectedReservation.id,
          _code: selectedReservation.code,
          client: selectedReservation.client,
          room: selectedReservation.room,
          checkIn: selectedReservation.checkIn,
          checkOut: selectedReservation.checkOut,
        }}
      />

      {/* Modal Pago */}
      <Modal
        isOpen={showPaymentModal && !!generatedInvoice}
        onClose={() => setShowPaymentModal(false)}
        title="Registrar Pago"
        size="md"
      >
        {generatedInvoice && (
          <div className="space-y-4">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-600">Factura</p>
              <p className="font-semibold text-gray-900">{generatedInvoice.invoiceNumber}</p>
              <p className="text-sm text-gray-700 mt-1">
                Saldo pendiente: <strong>${generatedInvoice.outstandingBalance.toFixed(2)}</strong>
              </p>
            </div>
            {/* Pago con tarjeta (MercadoPago) */}
            {(selectedPaymentMethod === PaymentMethod.DEBIT_CARD || selectedPaymentMethod === PaymentMethod.CREDIT_CARD) && (
              <div className="space-y-2 pb-4 border-b border-gray-200">
                <p className="text-xs font-medium text-gray-500">Pago con tarjeta (redirige a pasarela segura):</p>
                {/* Reutilizamos el mismo botón usado en detalle de factura */}
                <MercadoPagoButton
                  invoiceId={generatedInvoice.id}
                  amount={generatedInvoice.outstandingBalance}
                  disabled={generatedInvoice.outstandingBalance <= 0}
                  method={selectedPaymentMethod}
                />
                <p className="text-[11px] text-gray-400">Al aprobarse el pago, el sistema actualizará automáticamente la factura.</p>
              </div>
            )}
            <PaymentForm
              invoiceId={String(generatedInvoice.id)}
              outstandingAmount={generatedInvoice.outstandingBalance}
              onSubmit={handleRegisterPayment}
              onMethodChange={setSelectedPaymentMethod}
              initialMethod={selectedPaymentMethod ?? PaymentMethod.CASH}
            />
          </div>
        )}
      </Modal>
    </div>
  );
};


