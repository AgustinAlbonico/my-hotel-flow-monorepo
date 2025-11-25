/**
 * CheckOutConfirmModal
 * Modal para confirmar el check-out de una reserva en estado IN_PROGRESS
 */
import React from 'react';
import { LogOut, Calendar, User, Home, AlertTriangle } from 'lucide-react';
import ConfirmActionModal from './ConfirmActionModal';

interface CheckOutConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: { roomCondition: 'GOOD' | 'REGULAR' | 'NEEDS_DEEP_CLEANING'; observations?: string }) => void;
  isLoading?: boolean;
  reservation: {
    _id: number;
    _code: string;
    client?: { firstName: string; lastName: string; dni: string };
    room?: { numeroHabitacion: string; tipo?: string };
    checkIn: string;
    checkOut: string;
  } | null;
}

export const CheckOutConfirmModal: React.FC<CheckOutConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  reservation,
}) => {
  const [roomCondition, setRoomCondition] = React.useState<
    'GOOD' | 'REGULAR' | 'NEEDS_DEEP_CLEANING'
  >('GOOD');
  const [observations, setObservations] = React.useState('');

  if (!reservation) {
    return (
      <ConfirmActionModal
        isOpen={isOpen}
        onClose={onClose}
        onConfirm={() => {}}
        title="Confirmar Check-out"
        confirmLabel="Confirmar Check-out"
        icon={<LogOut size={18} />}
        layoutSize="lg"
        isLoading={true}
        description="Cargando datos de la reserva..."
      />
    );
  }

  // Formatear fechas robusto
  function formatDate(dateStr: string) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? '-' : d.toLocaleDateString('es-AR');
  }
  const formattedCheckIn = formatDate(reservation.checkIn);
  const formattedCheckOut = formatDate(reservation.checkOut);

  return (
    <ConfirmActionModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={() => onConfirm({ roomCondition, observations: observations.trim() || undefined })}
      title="Confirmar Check-out"
      confirmLabel="Confirmar Check-out"
      icon={<LogOut size={18} />}
      layoutSize="lg"
      description="¿Está seguro que desea realizar el check-out de esta reserva?"
      note="Al confirmar se completará la reserva y la habitación volverá al flujo de limpieza o mantenimiento según el estado indicado."
      isLoading={isLoading}
      disabled={isLoading}
    >
      <div className="space-y-6">
        {/* Código de reserva */}
        <div className="mb-2">
          <span className="text-xs text-gray-500">Código de reserva</span>
          <span className="font-mono font-semibold text-primary-700 ml-2">{reservation._code}</span>
        </div>

        {/* Info huésped */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
            <div className="flex items-center gap-2 mb-2">
              <User size={18} className="text-gray-700" />
              <h3 className="font-semibold text-gray-900">Huésped</h3>
            </div>
            <p className="text-sm text-gray-700">{reservation.client?.firstName} {reservation.client?.lastName}</p>
            <p className="text-xs text-gray-500">DNI: {reservation.client?.dni}</p>
          </div>
          <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
            <div className="flex items-center gap-2 mb-2">
              <Home size={18} className="text-gray-700" />
              <h3 className="font-semibold text-gray-900">Habitación</h3>
            </div>
            <p className="text-sm text-gray-700">#{reservation.room?.numeroHabitacion}</p>
            {reservation.room?.tipo && (
              <p className="text-xs text-gray-500">Tipo: {reservation.room.tipo}</p>
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
            <p className="text-sm font-mono text-gray-900">{formattedCheckIn}</p>
          </div>
          <div className="p-4 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-1">
              <Calendar size={16} className="text-primary-600" />
              <span className="text-sm font-medium text-gray-700">Check-out</span>
            </div>
            <p className="text-sm font-mono text-gray-900">{formattedCheckOut}</p>
          </div>
        </div>

        {/* Estado habitación al salir */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-700">Estado de la habitación al salir</label>
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'GOOD', label: 'Buena' },
              { value: 'REGULAR', label: 'Regular' },
              {
                value: 'NEEDS_DEEP_CLEANING',
                label: 'Necesita limpieza profunda',
              },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setRoomCondition(opt.value as typeof roomCondition)}
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

        {/* Observaciones opcionales */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Observaciones (opcional)</label>
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
            Al confirmar se completará la reserva y la habitación volverá al flujo de limpieza o mantenimiento según el estado indicado.
          </p>
        </div>

      </div>
    </ConfirmActionModal>
  );
};

export default CheckOutConfirmModal;