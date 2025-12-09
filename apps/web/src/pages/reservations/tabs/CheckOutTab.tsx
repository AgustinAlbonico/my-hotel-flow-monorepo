/**
 * Check-out Tab
 * Tab para realizar check-out y facturación
 * Adaptado de ActiveReservationsPage.tsx
 */
import React, { useState } from 'react';
import {
  LogOut,
  Calendar,
  User,
  Home,
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

interface ApiErrorLike {
  response?: {
    data?: {
      message?: string;
    };
  };
}

export const CheckOutTab: React.FC = () => {
  const { showToast } = useToast();
  const {
    data: reservations,
    isLoading,
    error,
  } = useActiveReservations();
  const checkOutMutation = useCheckOut();

  const [selectedReservation, setSelectedReservation] = useState<ActiveReservation | null>(null);
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
      await checkOutMutation.mutateAsync({
        reservationId: selectedReservation.id,
        roomCondition,
        observations,
      });

      const invoice = await generateInvoice(selectedReservation.id);
      setGeneratedInvoice(invoice);

      showToast({
        type: 'success',
        title: 'Check-out exitoso',
        message: 'Se generó la factura. Podés registrar el pago ahora.',
      });

      setShowConfirmModal(false);
      setSelectedPaymentMethod(PaymentMethod.CASH);
      setShowPaymentModal(true);
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Error en check-out',
        message: (err as ApiErrorLike).response?.data?.message || 'No se pudo completar el check-out',
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
        message: (err as ApiErrorLike).response?.data?.message || 'No se pudo registrar el pago',
      });
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? '-' : d.toLocaleDateString('es-AR');
  };

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
      <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg">
        <div className="flex items-start">
          <LogOut className="text-green-600 mt-0.5 mr-3" size={20} />
          <div>
            <h3 className="text-sm font-medium text-green-800">Check-out de Reservas</h3>
            <p className="text-sm text-green-700 mt-1">
              Selecciona una reserva activa para realizar el check-out y generar la factura
            </p>
          </div>
        </div>
      </div>

      {/* Reservations List */}
      {!reservations || reservations.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Calendar className="mx-auto text-gray-300 mb-4" size={48} />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No hay reservas activas
          </h3>
          <p className="text-sm text-gray-600">
            Actualmente no hay huéspedes alojados en el hotel.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {(reservations as ActiveReservation[]).map((reservation) => (
            <div
              key={reservation.id}
              className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      <span className="font-mono text-primary-700">{reservation.code}</span>
                    </h3>
                    <span className="px-2.5 py-0.5 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                      En progreso
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
                              {reservation.room.tipoNombre}
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
                          {formatDate(reservation.checkIn)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Clock className="text-gray-400 flex-shrink-0 mt-0.5" size={14} />
                      <div>
                        <p className="text-gray-500 text-xs">Check-out previsto</p>
                        <p className="font-medium text-gray-900 text-xs">
                          {formatDate(reservation.checkOut)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {selectedReservation?.id === reservation.id ? (
                <div className="border-t pt-4 mt-4">
                  <h4 className="font-semibold text-gray-900 mb-3 text-sm">
                    Detalles del Check-out
                  </h4>
                  
                  <div className="mb-3">
                    <label className="block text-xs font-medium text-gray-700 mb-2">
                      Condición de la habitación
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => setRoomCondition('GOOD')}
                        className={`p-2 border-2 rounded-lg text-center transition-colors ${
                          roomCondition === 'GOOD'
                            ? 'border-green-500 bg-green-50 text-green-800'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <CheckCircle2 className="mx-auto mb-1" size={16} />
                        <p className="text-xs font-medium">Buena</p>
                      </button>
                      <button
                        onClick={() => setRoomCondition('REGULAR')}
                        className={`p-2 border-2 rounded-lg text-center transition-colors ${
                          roomCondition === 'REGULAR'
                            ? 'border-yellow-500 bg-yellow-50 text-yellow-800'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <AlertTriangle className="mx-auto mb-1" size={16} />
                        <p className="text-xs font-medium">Regular</p>
                      </button>
                      <button
                        onClick={() => setRoomCondition('NEEDS_DEEP_CLEANING')}
                        className={`p-2 border-2 rounded-lg text-center transition-colors ${
                          roomCondition === 'NEEDS_DEEP_CLEANING'
                            ? 'border-error-500 bg-error-50 text-error-800'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <AlertTriangle className="mx-auto mb-1" size={16} />
                        <p className="text-xs font-medium">Limpieza profunda</p>
                      </button>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Observaciones (opcional)
                    </label>
                    <textarea
                      value={observations}
                      onChange={(e) => setObservations(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                      rows={2}
                      placeholder="Observaciones sobre el estado de la habitación..."
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowConfirmModal(true)}
                      disabled={checkOutMutation.isPending}
                      className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
                    >
                      {checkOutMutation.isPending ? (
                        <>
                          <Loader2 className="inline-block animate-spin mr-2" size={16} />
                          Procesando...
                        </>
                      ) : (
                        <>
                          <LogOut className="inline-block mr-2" size={16} />
                          Confirmar Check-out
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setSelectedReservation(null);
                        setRoomCondition('GOOD');
                        setObservations('');
                      }}
                      disabled={checkOutMutation.isPending}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 font-medium text-sm"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-end pt-3 border-t border-gray-100">
                  <button
                    onClick={() => setSelectedReservation(reservation)}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium text-sm flex items-center gap-2"
                  >
                    <LogOut size={16} />
                    Realizar Check-out
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

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
            {(selectedPaymentMethod === PaymentMethod.DEBIT_CARD || selectedPaymentMethod === PaymentMethod.CREDIT_CARD) && (
              <div className="space-y-2 pb-4 border-b border-gray-200">
                <p className="text-xs font-medium text-gray-500">Pago con tarjeta (pasarela segura):</p>
                <MercadoPagoButton
                  invoiceId={generatedInvoice.id}
                  amount={generatedInvoice.outstandingBalance}
                  disabled={generatedInvoice.outstandingBalance <= 0}
                  method={selectedPaymentMethod}
                />
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

export default CheckOutTab;
