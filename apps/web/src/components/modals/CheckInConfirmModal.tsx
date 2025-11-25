/**
 * Check-in Confirmation Modal
 * Modal para confirmar check-in con información del cliente y habitación
 */
import React, { useEffect, useState } from 'react';
import { LogIn, User, Home, Calendar, Loader2 } from 'lucide-react';
import ConfirmActionModal from './ConfirmActionModal';
import type { ReservationListItem } from '@/api/reservations.api';

interface CheckInConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: { documentsVerified?: boolean }) => void;
  reservation?: CheckInReservation | null;
  isLoading?: boolean;
}

export interface CheckInReservation {
  id: number;
  code: string;
  clientId: number | null;
  roomId: number | null;
  checkIn: string;
  checkOut: string;
  createdAt: string;
  client?: ReservationListItem['client'];
  room?: ReservationListItem['room'];
}

export const CheckInConfirmModal: React.FC<CheckInConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  reservation,
  isLoading = false,
}) => {
  const [clientLabel, setClientLabel] = useState<string>('');
  const [roomLabel, setRoomLabel] = useState<string>('');
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [documentsVerified, setDocumentsVerified] = useState<boolean>(false);
  const [periodLabel, setPeriodLabel] = useState<string>('');

  useEffect(() => {
    const loadData = async () => {
      if (!isOpen || !reservation) return;

      setLoadingData(true);
      setError(null);

      try {
        // Preferir los datos ya cargados en la reserva
        if (reservation.client) {
          const dni = reservation.client.dni
            ? ` · DNI ${reservation.client.dni}`
            : '';
          setClientLabel(
            `${reservation.client.firstName} ${reservation.client.lastName}${dni}`,
          );
        } else {
          setClientLabel('No disponible');
        }

        if (reservation.room) {
          const tipo =
            reservation.room.roomTypeName || reservation.room.roomTypeCode;
          const tipoLabel = tipo ? ` · ${tipo}` : '';
          setRoomLabel(
            `Hab. ${reservation.room.numeroHabitacion}${tipoLabel}`,
          );
        } else {
          setRoomLabel('No asignada');
        }

        // Período de estadía
        const checkInDate = reservation.checkIn
          ? new Date(reservation.checkIn)
          : null;
        const checkOutDate = reservation.checkOut
          ? new Date(reservation.checkOut)
          : null;

        const format = (d: Date | null) =>
          d && !Number.isNaN(d.getTime())
            ? d.toLocaleDateString('es-AR')
            : null;

        const from = format(checkInDate);
        const to = format(checkOutDate);

        if (from && to) {
          setPeriodLabel(`${from} - ${to}`);
        } else if (from) {
          setPeriodLabel(from);
        } else if (to) {
          setPeriodLabel(to);
        } else {
          setPeriodLabel('No disponible');
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Error loading reservation details:', err);
        setError('No se pudieron cargar los detalles');
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, [isOpen, reservation]);

  // Guardar cuando no hay reserva aún para evitar TypeError
  if (!reservation) {
    return (
      <ConfirmActionModal
        isOpen={isOpen}
        onClose={onClose}
        onConfirm={() => onConfirm({ documentsVerified })}
        title="Confirmar Check-in"
        confirmLabel="Confirmar Check-in"
        icon={<LogIn size={18} />}
        isLoading={true}
        layoutSize="md"
        description="Cargando datos de la reserva..."
      >
        <div className="flex items-center justify-center py-8">
          <Loader2 className="animate-spin text-primary-600" size={32} />
        </div>
      </ConfirmActionModal>
    );
  }

  return (
    <ConfirmActionModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={() => onConfirm({ documentsVerified })}
      title="Confirmar Check-in"
      confirmLabel="Confirmar Check-in"
      icon={<LogIn size={18} />}
      description={
        !loadingData && !error
          ? '¿Está seguro que desea realizar el check-in para esta reserva?'
          : undefined
      }
      isLoading={isLoading || loadingData}
      disabled={!!error}
      errorMessage={error}
      layoutSize="md"
      note={
        !loadingData && !error
          ? 'Al confirmar, la reserva pasará a estado EN PROGRESO y el huésped podrá acceder a la habitación.'
          : undefined
      }
    >
      {loadingData ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="animate-spin text-primary-600" size={32} />
        </div>
      ) : (
        <div className="bg-gray-50 rounded-lg p-4 space-y-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-white rounded-lg">
              <User className="text-primary-600" size={20} />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-600">Cliente</p>
              <p className="font-semibold text-gray-900">{clientLabel}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="p-2 bg-white rounded-lg">
              <Home className="text-primary-600" size={20} />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-600">Habitación</p>
              <p className="font-semibold text-gray-900">{roomLabel}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="p-2 bg-white rounded-lg">
              <Calendar className="text-primary-600" size={20} />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-600">Período</p>
              <p className="font-semibold text-gray-900">{periodLabel}</p>
            </div>
          </div>
          <div className="pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">Código de Reserva</p>
            <p className="font-mono font-semibold text-gray-900">{reservation._code}</p>
          </div>
          <div className="pt-4 border-t border-gray-200 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">
                Documentos verificados
              </p>
              <p className="text-xs text-gray-500">
                Marcar si se revisó la identidad del huésped (DNI/pasaporte).
              </p>
            </div>
            <label className="inline-flex items-center cursor-pointer">
              <span className="mr-2 text-sm text-gray-700">No</span>
              <button
                type="button"
                onClick={() => setDocumentsVerified((prev) => !prev)}
                className={`w-10 h-6 rounded-full transition-colors ${
                  documentsVerified ? 'bg-primary-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`block w-4 h-4 bg-white rounded-full shadow transform transition-transform mt-1 ml-1 ${
                    documentsVerified ? 'translate-x-4' : ''
                  }`}
                />
              </button>
              <span className="ml-2 text-sm text-gray-700">Sí</span>
            </label>
          </div>
        </div>
      )}
    </ConfirmActionModal>
  );
};
