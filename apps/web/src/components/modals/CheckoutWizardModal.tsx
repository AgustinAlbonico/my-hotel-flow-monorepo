/**
 * CheckoutWizardModal
 * Modal con múltiples pasos para realizar checkout completo:
 * 1. Confirmación de datos y estado de habitación
 * 2. Visualización de factura generada
 * 3. Registro de pago
 */
import React, { useState, useEffect } from 'react';
import {
  LogOut,
  Calendar,
  User,
  Home,
  AlertTriangle,
  CheckCircle2,
  FileText,
  DollarSign,
  ChevronRight,
  ChevronLeft,
  Loader2,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { PaymentForm } from '../ui/PaymentForm';
import { MercadoPagoButton } from '../payment/MercadoPagoButton';
import { generateInvoice } from '@/api/invoices.api';
import { registerPayment } from '@/api/payments.api';
import type { Invoice } from '@/types/billing.types';
import { PaymentMethod } from '@/types/billing.types';
import { useToast } from '@/contexts/ToastContext';

interface CheckoutWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  reservation: {
    id: number;
    code: string;
    client?: { firstName: string; lastName: string; dni: string };
    room?: { numeroHabitacion: string; tipoNombre?: string };
    checkIn: string;
    checkOut: string;
  } | null;
  onCheckOut: (data: {
    roomCondition: 'GOOD' | 'REGULAR' | 'NEEDS_DEEP_CLEANING';
    observations?: string;
  }) => Promise<void>;
}

type Step = 'confirm' | 'invoice' | 'payment' | 'complete';

export const CheckoutWizardModal: React.FC<CheckoutWizardModalProps> = ({
  isOpen,
  onClose,
  onComplete,
  reservation,
  onCheckOut,
}) => {
  const { showToast } = useToast();
  const [currentStep, setCurrentStep] = useState<Step>('confirm');
  const [isProcessing, setIsProcessing] = useState(false);

  // Step 1: Confirmación
  const [roomCondition, setRoomCondition] = useState<
    'GOOD' | 'REGULAR' | 'NEEDS_DEEP_CLEANING'
  >('GOOD');
  const [observations, setObservations] = useState('');

  // Step 2: Factura
  const [generatedInvoice, setGeneratedInvoice] = useState<Invoice | null>(null);

  // Step 3: Pago
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>(
    PaymentMethod.CASH
  );

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setCurrentStep('confirm');
      setRoomCondition('GOOD');
      setObservations('');
      setGeneratedInvoice(null);
      setSelectedPaymentMethod(PaymentMethod.CASH);
    }
  }, [isOpen]);

  if (!reservation) return null;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? '-' : d.toLocaleDateString('es-AR');
  };

  const handleConfirmCheckout = async () => {
    try {
      setIsProcessing(true);

      // 1. Realizar checkout
      await onCheckOut({ roomCondition, observations: observations.trim() || undefined });

      // 2. Generar factura
      const invoice = await generateInvoice(reservation.id);
      setGeneratedInvoice(invoice);

      showToast({
        type: 'success',
        title: 'Check-out exitoso',
        message: 'Factura generada correctamente',
      });

      // Avanzar al siguiente paso
      setCurrentStep('invoice');
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data?.message ||
        'Error al realizar el check-out';
      showToast({
        type: 'error',
        title: 'Error',
        message,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRegisterPayment = async (data: {
    amount: number;
    method: PaymentMethod;
    reference?: string;
  }) => {
    if (!generatedInvoice) return;

    try {
      setIsProcessing(true);

      await registerPayment({
        invoiceId: generatedInvoice.id,
        clientId: reservation.client?.dni ? Number(reservation.id) : 0,
        amount: data.amount,
        method: data.method,
        reference: data.reference,
      });

      showToast({
        type: 'success',
        title: 'Pago registrado',
        message: 'El pago se registró correctamente',
      });

      // Avanzar al paso final
      setCurrentStep('complete');
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data?.message ||
        'Error al registrar el pago';
      showToast({
        type: 'error',
        title: 'Error',
        message,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFinish = () => {
    onComplete();
    onClose();
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 'confirm':
        return 'Confirmar Check-out';
      case 'invoice':
        return 'Factura Generada';
      case 'payment':
        return 'Registrar Pago';
      case 'complete':
        return 'Check-out Completo';
      default:
        return '';
    }
  };

  const renderStepIndicator = () => {
    const steps = [
      { key: 'confirm', label: 'Confirmar', icon: LogOut },
      { key: 'invoice', label: 'Factura', icon: FileText },
      { key: 'payment', label: 'Pago', icon: DollarSign },
      { key: 'complete', label: 'Finalizar', icon: CheckCircle2 },
    ];

    const currentIndex = steps.findIndex((s) => s.key === currentStep);

    return (
      <div className="flex items-center justify-between mb-6 px-4">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = index === currentIndex;
          const isCompleted = index < currentIndex;

          return (
            <React.Fragment key={step.key}>
              <div className="flex flex-col items-center gap-2">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                    isActive
                      ? 'bg-primary-600 text-white'
                      : isCompleted
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  <Icon size={20} />
                </div>
                <span
                  className={`text-xs font-medium ${
                    isActive ? 'text-primary-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 transition-colors ${
                    isCompleted ? 'bg-green-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  const renderConfirmStep = () => (
    <div className="space-y-6">
      {/* Código de reserva */}
      <div className="mb-2">
        <span className="text-xs text-gray-500">Código de reserva</span>
        <span className="font-mono font-semibold text-primary-700 ml-2">{reservation.code}</span>
      </div>

      {/* Info huésped y habitación */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2 mb-2">
            <User size={18} className="text-gray-700" />
            <h3 className="font-semibold text-gray-900">Huésped</h3>
          </div>
          <p className="text-sm text-gray-700">
            {reservation.client?.firstName} {reservation.client?.lastName}
          </p>
          <p className="text-xs text-gray-500">DNI: {reservation.client?.dni}</p>
        </div>
        <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2 mb-2">
            <Home size={18} className="text-gray-700" />
            <h3 className="font-semibold text-gray-900">Habitación</h3>
          </div>
          <p className="text-sm text-gray-700">#{reservation.room?.numeroHabitacion}</p>
          {reservation.room?.tipoNombre && (
            <p className="text-xs text-gray-500">Tipo: {reservation.room.tipoNombre}</p>
          )}
        </div>
      </div>

      {/* Fechas */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-1">
            <Calendar size={16} className="text-primary-600" />
            <span className="text-sm font-medium text-gray-700">Check-in</span>
          </div>
          <p className="text-sm font-mono text-gray-900">{formatDate(reservation.checkIn)}</p>
        </div>
        <div className="p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-1">
            <Calendar size={16} className="text-primary-600" />
            <span className="text-sm font-medium text-gray-700">Check-out</span>
          </div>
          <p className="text-sm font-mono text-gray-900">{formatDate(reservation.checkOut)}</p>
        </div>
      </div>

      {/* Estado habitación */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-700">
          Estado de la habitación al salir
        </label>
        <div className="flex flex-wrap gap-2">
          {[
            { value: 'GOOD', label: 'Buena' },
            { value: 'REGULAR', label: 'Regular' },
            { value: 'NEEDS_DEEP_CLEANING', label: 'Necesita limpieza profunda' },
          ].map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() =>
                setRoomCondition(opt.value as 'GOOD' | 'REGULAR' | 'NEEDS_DEEP_CLEANING')
              }
              className={
                'px-3 py-1.5 rounded-full text-sm border transition ' +
                (roomCondition === opt.value
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50')
              }
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Observaciones */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Observaciones (opcional)
        </label>
        <textarea
          value={observations}
          onChange={(e) => setObservations(e.target.value)}
          rows={3}
          maxLength={400}
          placeholder="Ej: Faltan toallas, televisor sin señal, etc"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
        />
        <p className="text-xs text-gray-500 mt-1">{observations.length}/400 caracteres</p>
      </div>

      {/* Nota */}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
        <AlertTriangle size={18} className="text-amber-600 mt-0.5" />
        <p className="text-sm text-amber-800">
          Al confirmar se completará la reserva y se generará la factura automáticamente.
        </p>
      </div>
    </div>
  );

  const renderInvoiceStep = () => {
    if (!generatedInvoice) return null;

    return (
      <div className="space-y-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
          <CheckCircle2 size={20} className="text-green-600 mt-0.5" />
          <div>
            <p className="font-medium text-green-900">Check-out realizado con éxito</p>
            <p className="text-sm text-green-700 mt-1">
              Se ha generado la factura #{generatedInvoice.invoiceNumber}
            </p>
          </div>
        </div>

        {/* Detalles de la factura */}
        <div className="border border-gray-200 rounded-lg divide-y">
          <div className="p-4">
            <h4 className="font-semibold text-gray-900 mb-3">Detalles de la Factura</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Número:</span>
                <span className="font-mono font-medium">{generatedInvoice.invoiceNumber}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Fecha:</span>
                <span className="font-medium">
                  {new Date(generatedInvoice.createdAt).toLocaleDateString('es-AR')}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Cliente:</span>
                <span className="font-medium">
                  {reservation.client?.firstName} {reservation.client?.lastName}
                </span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-gray-50">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Total a Pagar:</span>
              <span className="text-2xl font-bold text-gray-900">
                ${generatedInvoice.outstandingBalance.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            Ahora puede proceder a registrar el pago de la factura.
          </p>
        </div>
      </div>
    );
  };

  const renderPaymentStep = () => {
    if (!generatedInvoice) return null;

    return (
      <div className="space-y-6">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-600">Factura</p>
          <p className="font-semibold text-gray-900">{generatedInvoice.invoiceNumber}</p>
          <p className="text-sm text-gray-700 mt-1">
            Saldo pendiente:{' '}
            <strong>${generatedInvoice.outstandingBalance.toFixed(2)}</strong>
          </p>
        </div>

        {/* Pago con tarjeta (MercadoPago) */}
        {(selectedPaymentMethod === PaymentMethod.DEBIT_CARD ||
          selectedPaymentMethod === PaymentMethod.CREDIT_CARD) && (
          <div className="space-y-2 pb-4 border-b border-gray-200">
            <p className="text-xs font-medium text-gray-500">
              Pago con tarjeta (redirige a pasarela segura):
            </p>
            <MercadoPagoButton
              invoiceId={generatedInvoice.id}
              amount={generatedInvoice.outstandingBalance}
              disabled={generatedInvoice.outstandingBalance <= 0}
              method={selectedPaymentMethod}
            />
            <p className="text-[11px] text-gray-400">
              Al aprobarse el pago, el sistema actualizará automáticamente la factura.
            </p>
          </div>
        )}

        <PaymentForm
          invoiceId={String(generatedInvoice.id)}
          outstandingAmount={generatedInvoice.outstandingBalance}
          onSubmit={handleRegisterPayment}
          onMethodChange={setSelectedPaymentMethod}
          initialMethod={selectedPaymentMethod}
          isLoading={isProcessing}
        />
      </div>
    );
  };

  const renderCompleteStep = () => (
    <div className="space-y-6 text-center py-8">
      <div className="flex justify-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle2 size={48} className="text-green-600" />
        </div>
      </div>

      <div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">¡Check-out Completo!</h3>
        <p className="text-gray-600">
          El check-out se ha realizado exitosamente y el pago ha sido registrado.
        </p>
      </div>

      {generatedInvoice && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-left">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Reserva:</span>
              <span className="font-mono font-medium">{reservation.code}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Factura:</span>
              <span className="font-mono font-medium">{generatedInvoice.invoiceNumber}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Cliente:</span>
              <span className="font-medium">
                {reservation.client?.firstName} {reservation.client?.lastName}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          Puede cerrar esta ventana o ver el comprobante en el módulo de facturas.
        </p>
      </div>
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 'confirm':
        return renderConfirmStep();
      case 'invoice':
        return renderInvoiceStep();
      case 'payment':
        return renderPaymentStep();
      case 'complete':
        return renderCompleteStep();
      default:
        return null;
    }
  };

  const renderFooter = () => {
    if (currentStep === 'complete') {
      return (
        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            onClick={handleFinish}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
          >
            Finalizar
          </button>
        </div>
      );
    }

    if (currentStep === 'confirm') {
      return (
        <div className="flex justify-between gap-3 pt-4 border-t">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirmCheckout}
            disabled={isProcessing}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2"
          >
            {isProcessing ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                Confirmar Check-out
                <ChevronRight size={18} />
              </>
            )}
          </button>
        </div>
      );
    }

    if (currentStep === 'invoice') {
      return (
        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            onClick={() => setCurrentStep('payment')}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium flex items-center gap-2"
          >
            Continuar al Pago
            <ChevronRight size={18} />
          </button>
        </div>
      );
    }

    if (currentStep === 'payment') {
      return (
        <div className="flex justify-between gap-3 pt-4 border-t">
          <button
            onClick={() => setCurrentStep('invoice')}
            disabled={isProcessing}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 font-medium flex items-center gap-2"
          >
            <ChevronLeft size={18} />
            Volver
          </button>
          <button
            onClick={() => {
              // Opción para omitir el pago y finalizar
              setCurrentStep('complete');
            }}
            disabled={isProcessing}
            className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium"
          >
            Registrar pago más tarde
          </button>
        </div>
      );
    }

    return null;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={getStepTitle()} size="lg">
      <div className="space-y-6">
        {renderStepIndicator()}
        {renderStepContent()}
        {renderFooter()}
      </div>
    </Modal>
  );
};

export default CheckoutWizardModal;
