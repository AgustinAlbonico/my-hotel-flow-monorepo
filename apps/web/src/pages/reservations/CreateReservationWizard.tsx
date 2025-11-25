import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { reservationsApi, ClientFound, AvailableRoom } from '../../api/reservations.api';
import { useRoomTypes } from '../../hooks/useRoomTypes';
import { Check, AlertCircle, Calendar, Bed, Bell, CheckCircle, User, Printer } from 'lucide-react';
import { SettleDebtModal } from '@/components/account/SettleDebtModal';

type WizardStep = 1 | 2 | 3 | 4 | 5;

interface ReservationFormData {
  dni: string;
  client: ClientFound | null;
  checkInDate: string;
  checkOutDate: string;
  roomType: string;
  capacity?: number;
  selectedRoom: AvailableRoom | null;
  notifyByEmail: boolean;
  notifyBySMS: boolean;
}

export default function CreateReservationWizard() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [formData, setFormData] = useState<ReservationFormData>({
    dni: '',
    client: null,
    checkInDate: '',
    checkOutDate: '',
    roomType: '',
    capacity: 2,
    selectedRoom: null,
    notifyByEmail: true,
    notifyBySMS: false,
  });
  const [dniError, setDniError] = useState<string>('');
  const [dniWarningType, setDniWarningType] = useState<'NOT_FOUND' | 'ACTIVE_RESERVATION' | 'GENERIC_ERROR' | ''>('');
  const [createError, setCreateError] = useState<string>('');
  const [showDebtModal, setShowDebtModal] = useState(false);

  // Obtener tipos de habitación activos usando el hook personalizado
  const { activeRoomTypes, loadingActive } = useRoomTypes();

  // activeRoomTypes ya es el array directamente, no tiene .data
  const roomTypes = useMemo(() => activeRoomTypes || [], [activeRoomTypes]);
  const loadingRoomTypes = loadingActive;
  const roomTypesError = !loadingActive && roomTypes.length === 0;

  // Establecer el primer tipo de habitación por defecto cuando se cargan
  useEffect(() => {
    if (roomTypes.length > 0 && !formData.roomType) {
      setFormData((prev) => ({
        ...prev,
        roomType: roomTypes[0].code,
        capacity: Math.min(prev.capacity || 1, roomTypes[0].capacidadMaxima),
      }));
    }
  }, [roomTypes, formData.roomType]);

  // Capacidad máxima por tipo de habitación (dinámico)
  const getMaxCapacity = (roomTypeCode: string): number => {
    const roomType = roomTypes.find((rt) => rt.code === roomTypeCode);
    return roomType?.capacidadMaxima || 2;
  };

  // Step 1: Buscar cliente
  const searchClientMutation = useMutation({
    mutationFn: (dni: string) => reservationsApi.searchClientByDNI(dni),
    onSuccess: async (data) => {
      if (!data) {
        setDniError('Cliente no encontrado. Verifique el DNI.');
        setDniWarningType('NOT_FOUND');
        return;
      }

      // Guardar cliente en estado
      setFormData((prev) => ({ ...prev, client: data }));

      // Resetear mensajes previos
      setDniError('');
      setDniWarningType('');

      // Primero, si es deudor mostramos el modal de deuda
      if (data.isDebtor) {
        setShowDebtModal(true);
        return;
      }

      try {
        // Verificar si el cliente tiene reservas activas/pendientes
        const reservationsResponse = await reservationsApi.getReservationsByClient(data.id, {
          status: 'CONFIRMED',
        });

        const hasActiveReservations = (reservationsResponse.data?.length ?? 0) > 0;

        if (hasActiveReservations) {
          setDniError(
            'El cliente ya tiene una reserva activa. No se puede crear otra hasta que se complete o cancele la actual.',
          );
          setDniWarningType('ACTIVE_RESERVATION');
          return;
        }

        // Si no tiene deuda ni reservas activas, podemos continuar al paso 2
        setCurrentStep(2);
      } catch (e) {
        // Si falla la verificación de reservas, mostramos un error genérico pero no avanzamos
        setDniError('Ocurrió un error al verificar las reservas del cliente. Intente nuevamente.');
        setDniWarningType('GENERIC_ERROR');
      }
    },
    onError: (error: unknown) => {
      // Con el interceptor nuevo, los 404 vienen como EnhancedApiError
      // con code "Not Found" y mensaje "Cliente no encontrado".
      if (error instanceof Error) {
        // Si es error de "cliente no encontrado", activamos el flujo de crear cliente
        if (error.message.includes('Cliente no encontrado')) {
          setDniError('Cliente no encontrado. Verifique el DNI.');
          setDniWarningType('NOT_FOUND');
          return;
        }
        // Si el backend indica que el cliente ya tiene una reserva activa
        if (error.message.includes('ya tiene una reserva activa')) {
          setDniError(
            'El cliente ya tiene una reserva activa. No se puede crear otra hasta que se complete o cancele la actual.',
          );
          setDniWarningType('ACTIVE_RESERVATION');
          return;
        }
      }
      // Otros errores: mostrar mensaje genérico
      setDniError('Ocurrió un error al buscar el cliente. Intente nuevamente.');
      setDniWarningType('GENERIC_ERROR');
    },
  });

  // Step 2: Buscar habitaciones
  const { data: availableRooms = [], isLoading: loadingRooms } = useQuery({
    queryKey: ['availableRooms', formData.checkInDate, formData.checkOutDate, formData.roomType, formData.capacity],
    queryFn: () =>
      reservationsApi.getAvailableRooms({
        checkInDate: formData.checkInDate,
        checkOutDate: formData.checkOutDate,
        roomType: formData.roomType,
        capacity: formData.capacity,
      }),
    enabled: 
      currentStep === 3 && 
      !!formData.checkInDate && 
      !!formData.checkOutDate && 
      !!formData.roomType &&
      !!formData.capacity && 
      formData.capacity > 0,
  });

  // Step 5: Crear reserva
  const createReservationMutation = useMutation({
    mutationFn: () =>
      reservationsApi.createReservation({
        clientId: formData.client!.id,
        roomId: formData.selectedRoom!.id,
        checkIn: formData.checkInDate,
        checkOut: formData.checkOutDate,
        notifyByEmail: formData.notifyByEmail,
        notifyBySMS: formData.notifyBySMS,
      }),
    onSuccess: () => {
      setCreateError('');
      setTimeout(() => navigate('/reservations'), 2000);
    },
    onError: (error: unknown) => {
      if (error instanceof Error) {
        if (error.message.includes('ya tiene una reserva activa')) {
          setCreateError(
            'El cliente ya tiene una reserva activa. No se puede crear otra hasta que se complete o cancele la actual.',
          );
          return;
        }
      }
      setCreateError('No se pudo crear la reserva. Intente nuevamente.');
    },
  });

  // Helper: verifica deuda y abre modal si corresponde. Devuelve true si NO hay deuda.
  const ensureNoDebt = (): boolean => {
    if (!formData.client) return true;
    if (formData.client.isDebtor) {
      setShowDebtModal(true);
      return false;
    }
    return true;
  };

  const handleStep1Submit = () => {
    if (formData.dni.length < 7 || formData.dni.length > 8) {
      setDniError('DNI debe tener entre 7 y 8 dígitos');
      return;
    }
    if (!/^\d+$/.test(formData.dni)) {
      setDniError('DNI debe contener solo números');
      return;
    }
    searchClientMutation.mutate(formData.dni);
  };

  const handleStep2Submit = async () => {
    if (!formData.checkInDate || !formData.checkOutDate) {
      return;
    }
    if (new Date(formData.checkInDate) >= new Date(formData.checkOutDate)) {
      return;
    }
    const ok = ensureNoDebt();
    if (!ok) return;
    setCurrentStep(3);
  };

  const renderStepIndicator = () => {
    const steps = [
      { num: 1, label: 'Cliente' },
      { num: 2, label: 'Fechas' },
      { num: 3, label: 'Habitación' },
      { num: 4, label: 'Notificaciones' },
      { num: 5, label: 'Confirmar' },
    ];

    return (
      <div className="flex items-center justify-between mb-8">
        {steps.map((step, idx) => (
          <div key={step.num} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  currentStep >= step.num
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {currentStep > step.num ? <Check size={20} /> : step.num}
              </div>
              <span className="text-xs mt-2 text-gray-600">{step.label}</span>
            </div>
            {idx < steps.length - 1 && (
              <div
                className={`h-1 flex-1 mx-2 ${
                  currentStep > step.num ? 'bg-primary-600' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderStep1 = () => {
    const isDniValid = formData.dni.length >= 7 && formData.dni.length <= 8;
    
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">Buscar Cliente</h2>
        <p className="text-gray-600">Ingrese el DNI del cliente para continuar</p>

        <div>
          <label htmlFor="dni" className="block text-sm font-medium text-gray-700 mb-2">
            DNI del Cliente
          </label>
          <input
            id="dni"
            type="text"
            maxLength={8}
            value={formData.dni}
            onChange={(e) => {
              setFormData({ ...formData, dni: e.target.value.replace(/\D/g, '') });
              setDniError('');
            }}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent ${
              formData.dni.length > 0 && !isDniValid 
                ? 'border-red-300 bg-red-50' 
                : 'border-gray-300'
            }`}
            placeholder="Ej: 12345678"
          />
          {formData.dni.length > 0 && !isDniValid && (
            <div className="mt-2 flex items-center text-red-600 text-sm">
              <AlertCircle size={16} className="mr-1" />
              El DNI debe tener entre 7 y 8 dígitos
            </div>
          )}
          {dniError && isDniValid && dniWarningType === 'NOT_FOUND' && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center text-yellow-800 mb-3">
                <AlertCircle size={20} className="mr-2" />
                <span className="font-medium">Cliente no encontrado</span>
              </div>
              <p className="text-sm text-yellow-700 mb-3">
                No existe un cliente con el DNI {formData.dni}. ¿Desea crear un nuevo perfil?
              </p>
              <button
                onClick={() => {
                  window.open(`/clients/create?dni=${formData.dni}`, '_blank');
                }}
                className="w-full bg-yellow-600 text-white py-2 px-4 rounded-lg hover:bg-yellow-700 font-medium flex items-center justify-center"
              >
                <User size={18} className="mr-2" />
                Crear Nuevo Cliente
              </button>
              <p className="text-xs text-yellow-600 mt-2 text-center">
                Se abrirá en una nueva pestaña. Luego vuelva aquí y busque nuevamente.
              </p>
            </div>
          )}

          {dniError && isDniValid && dniWarningType === 'ACTIVE_RESERVATION' && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center text-red-800 mb-3">
                <AlertCircle size={20} className="mr-2" />
                <span className="font-medium">Reserva activa encontrada</span>
              </div>
              <p className="text-sm text-red-700 mb-1">
                El cliente con DNI {formData.dni} ya tiene una reserva activa.
              </p>
              <p className="text-sm text-red-700 mb-3">
                No se puede crear otra reserva hasta que se complete o cancele la actual.
              </p>
            </div>
          )}

          {dniError && isDniValid && dniWarningType === 'GENERIC_ERROR' && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center text-red-800 mb-3">
                <AlertCircle size={20} className="mr-2" />
                <span className="font-medium">Error al buscar cliente</span>
              </div>
              <p className="text-sm text-red-700">
                {dniError}
              </p>
            </div>
          )}
        </div>

        <button
          onClick={handleStep1Submit}
          disabled={searchClientMutation.isPending || !isDniValid}
          className="w-full bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
        >
          {searchClientMutation.isPending ? 'Buscando...' : 'Buscar Cliente'}
        </button>
      </div>
    );
  };

  const renderStep2 = () => {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">Seleccionar Fechas</h2>
        <p className="text-gray-600">Cliente: {formData.client?.nombre} {formData.client?.apellido}</p>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar size={16} className="inline mr-1" />
              Check-in
            </label>
            <input
              type="date"
              value={formData.checkInDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setFormData({ ...formData, checkInDate: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar size={16} className="inline mr-1" />
              Check-out
            </label>
            <input
              type="date"
              value={formData.checkOutDate}
              min={formData.checkInDate || new Date().toISOString().split('T')[0]}
              onChange={(e) => setFormData({ ...formData, checkOutDate: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Habitación</label>
        {loadingRoomTypes ? (
          <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600">
            Cargando tipos de habitación...
          </div>
        ) : roomTypesError ? (
          <div className="w-full px-4 py-2 border border-red-300 rounded-lg bg-red-50 text-red-700">
            Error al cargar tipos de habitación. Por favor, intente nuevamente.
          </div>
        ) : !roomTypes || roomTypes.length === 0 ? (
          <div className="w-full px-4 py-2 border border-red-300 rounded-lg bg-red-50 text-red-700">
            No hay tipos de habitación disponibles. Por favor, configure los tipos de habitación primero.
          </div>
        ) : (
          <select
            value={formData.roomType}
            onChange={(e) => {
              const newRoomType = e.target.value;
              const maxCapacity = getMaxCapacity(newRoomType);
              setFormData({
                ...formData,
                roomType: newRoomType,
                capacity: Math.min(formData.capacity || 1, maxCapacity),
              });
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600"
          >
            {roomTypes.map((rt) => (
              <option key={rt.id} value={rt.code}>
                {rt.name} (máx. {rt.capacidadMaxima} personas)
              </option>
            ))}
          </select>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Cantidad de Personas</label>
        <input
          type="number"
          min={1}
          max={getMaxCapacity(formData.roomType)}
          value={formData.capacity}
          onChange={(e) => {
            const value = parseInt(e.target.value);
            if (!isNaN(value) && value >= 1 && value <= getMaxCapacity(formData.roomType)) {
              setFormData({ ...formData, capacity: value });
            }
          }}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600"
        />
        {formData.roomType && (
          <p className="text-sm text-gray-500 mt-1">
            Máximo {getMaxCapacity(formData.roomType)} personas para el tipo seleccionado
          </p>
        )}
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => setCurrentStep(1)}
          className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 font-medium"
        >
          Volver
        </button>
        <button
          onClick={handleStep2Submit}
          disabled={!formData.checkInDate || !formData.checkOutDate || !formData.roomType || roomTypes.length === 0}
          className="flex-1 bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 disabled:bg-gray-400 font-medium"
        >
          Continuar
        </button>
      </div>
    </div>
    );
  };

  const renderStep3 = () => (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900">Habitaciones Disponibles</h2>
      
      {loadingRooms ? (
        <div className="text-center py-8">Buscando habitaciones...</div>
      ) : availableRooms.length === 0 ? (
        <div className="text-center py-8 text-gray-600">No hay habitaciones disponibles</div>
      ) : (
        <div className="grid gap-4">
          {availableRooms.map((room) => (
            <div
              key={room.id}
              onClick={() => {
                setFormData({ ...formData, selectedRoom: room });
                setCurrentStep(4);
              }}
              className={`border-2 rounded-lg p-4 cursor-pointer hover:border-primary-600 ${
                formData.selectedRoom?.id === room.id ? 'border-primary-600 bg-primary-50' : 'border-gray-200'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <Bed size={20} />
                    <h3 className="font-semibold text-lg">Habitación {room.numeroHabitacion}</h3>
                  </div>
                  <p className="text-gray-600">{room.tipo} - Capacidad: {room.capacidad} personas</p>
                  <p className="text-sm text-gray-500 mt-1">{room.descripcion}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary-600">${room.precioTotal}</p>
                  <p className="text-sm text-gray-600">{room.cantidadNoches} noches</p>
                  <p className="text-xs text-gray-500">${room.precioPorNoche}/noche</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={() => setCurrentStep(2)}
        className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 font-medium"
      >
        Volver
      </button>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900">Preferencias de Notificación</h2>

      <div className="space-y-3">
        <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-primary-600">
          <input
            type="checkbox"
            checked={formData.notifyByEmail}
            onChange={(e) => setFormData({ ...formData, notifyByEmail: e.target.checked })}
            className="w-5 h-5"
          />
          <div className="flex items-center gap-2">
            <Bell size={20} />
            <div>
              <p className="font-medium">Notificar por Email</p>
              <p className="text-sm text-gray-600">{formData.client?.email}</p>
            </div>
          </div>
        </label>

        <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-primary-600">
          <input
            type="checkbox"
            checked={formData.notifyBySMS}
            onChange={(e) => setFormData({ ...formData, notifyBySMS: e.target.checked })}
            className="w-5 h-5"
          />
          <div className="flex items-center gap-2">
            <Bell size={20} />
            <div>
              <p className="font-medium">Notificar por SMS</p>
              <p className="text-sm text-gray-600">{formData.client?.telefono || 'No disponible'}</p>
            </div>
          </div>
        </label>
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => setCurrentStep(3)}
          className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 font-medium"
        >
          Volver
        </button>
        <button
          onClick={() => setCurrentStep(5)}
          className="flex-1 bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 font-medium"
        >
          Continuar
        </button>
      </div>
    </div>
  );

  const renderStep5 = () => {
    if (createReservationMutation.isSuccess) {
      const reservationData = createReservationMutation.data;
      
      const handlePrint = () => {
        // Crear contenido para impresión
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const printContent = `
          <!DOCTYPE html>
          <html>
            <head>
              <title>Comprobante de Reserva - ${reservationData.code}</title>
              <style>
                body {
                  font-family: Arial, sans-serif;
                  max-width: 800px;
                  margin: 40px auto;
                  padding: 20px;
                  line-height: 1.6;
                }
                .header {
                  text-align: center;
                  border-bottom: 3px solid #2563eb;
                  padding-bottom: 20px;
                  margin-bottom: 30px;
                }
                .header h1 {
                  color: #2563eb;
                  margin: 0;
                  font-size: 28px;
                }
                .code {
                  background: #eff6ff;
                  padding: 15px;
                  border-radius: 8px;
                  text-align: center;
                  font-size: 24px;
                  font-weight: bold;
                  color: #1e40af;
                  margin: 20px 0;
                }
                .section {
                  margin: 30px 0;
                }
                .section-title {
                  font-size: 18px;
                  font-weight: bold;
                  color: #374151;
                  margin-bottom: 15px;
                  border-bottom: 2px solid #e5e7eb;
                  padding-bottom: 8px;
                }
                .info-row {
                  display: flex;
                  justify-content: space-between;
                  padding: 10px 0;
                  border-bottom: 1px solid #f3f4f6;
                }
                .info-label {
                  color: #6b7280;
                  font-weight: 500;
                }
                .info-value {
                  color: #111827;
                  font-weight: 600;
                }
                .total {
                  background: #f9fafb;
                  padding: 20px;
                  border-radius: 8px;
                  margin-top: 20px;
                }
                .total-amount {
                  font-size: 32px;
                  color: #2563eb;
                  font-weight: bold;
                  text-align: right;
                }
                .footer {
                  margin-top: 50px;
                  padding-top: 20px;
                  border-top: 2px solid #e5e7eb;
                  text-align: center;
                  color: #6b7280;
                  font-size: 14px;
                }
                @media print {
                  body { margin: 0; padding: 20px; }
                  .no-print { display: none; }
                }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>🏨 My Hotel Flow</h1>
                <p style="color: #6b7280; margin: 10px 0 0 0;">Comprobante de Reserva</p>
              </div>

              <div class="code">
                📋 Código: ${reservationData.code}
              </div>

              <div class="section">
                <div class="section-title">Información del Cliente</div>
                <div class="info-row">
                  <span class="info-label">Nombre Completo:</span>
                  <span class="info-value">${formData.client?.nombre} ${formData.client?.apellido}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">DNI:</span>
                  <span class="info-value">${formData.client?.dni}</span>
                </div>
                ${formData.client?.email ? `
                <div class="info-row">
                  <span class="info-label">Email:</span>
                  <span class="info-value">${formData.client.email}</span>
                </div>
                ` : ''}
                ${formData.client?.telefono ? `
                <div class="info-row">
                  <span class="info-label">Teléfono:</span>
                  <span class="info-value">${formData.client.telefono}</span>
                </div>
                ` : ''}
              </div>

              <div class="section">
                <div class="section-title">Detalles de la Reserva</div>
                <div class="info-row">
                  <span class="info-label">Habitación:</span>
                  <span class="info-value">N° ${formData.selectedRoom?.numeroHabitacion}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Tipo:</span>
                  <span class="info-value">${roomTypes.find(rt => rt.code === formData.roomType)?.name || formData.roomType}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Capacidad:</span>
                  <span class="info-value">${formData.capacity} persona(s)</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Check-in:</span>
                  <span class="info-value">${new Date(formData.checkInDate).toLocaleDateString('es-AR')}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Check-out:</span>
                  <span class="info-value">${new Date(formData.checkOutDate).toLocaleDateString('es-AR')}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Cantidad de Noches:</span>
                  <span class="info-value">${formData.selectedRoom?.cantidadNoches}</span>
                </div>
              </div>

              <div class="total">
                <div class="info-row" style="border: none;">
                  <span class="info-label" style="font-size: 18px;">Total a Pagar:</span>
                  <span class="total-amount">$${formData.selectedRoom?.precioTotal}</span>
                </div>
              </div>

              <div class="footer">
                <p><strong>Importante:</strong> Presente este comprobante al momento del check-in.</p>
                <p>Fecha de emisión: ${new Date().toLocaleString('es-AR')}</p>
                <p style="margin-top: 20px;">¡Gracias por elegirnos! Esperamos que disfrute su estadía.</p>
              </div>

              <div class="no-print" style="text-align: center; margin-top: 30px;">
                <button onclick="window.print()" style="
                  background: #2563eb;
                  color: white;
                  padding: 12px 30px;
                  border: none;
                  border-radius: 8px;
                  font-size: 16px;
                  cursor: pointer;
                  font-weight: 600;
                ">🖨️ Imprimir</button>
                <button onclick="window.close()" style="
                  background: #6b7280;
                  color: white;
                  padding: 12px 30px;
                  border: none;
                  border-radius: 8px;
                  font-size: 16px;
                  cursor: pointer;
                  font-weight: 600;
                  margin-left: 10px;
                ">Cerrar</button>
              </div>
            </body>
          </html>
        `;

        printWindow.document.write(printContent);
        printWindow.document.close();
      };

      return (
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <CheckCircle size={80} className="text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">¡Reserva Creada Exitosamente!</h2>
          
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
            <p className="text-sm text-blue-600 mb-2">Código de Reserva</p>
            <p className="text-3xl font-bold text-blue-900">{reservationData.code}</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 space-y-3 text-left">
            <h3 className="font-semibold text-gray-900 mb-4">Resumen de la Reserva</h3>
            <div className="flex justify-between">
              <span className="text-gray-600">Cliente:</span>
              <span className="font-medium">{formData.client?.nombre} {formData.client?.apellido}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Habitación:</span>
              <span className="font-medium">N° {formData.selectedRoom?.numeroHabitacion}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Check-in:</span>
              <span className="font-medium">{new Date(formData.checkInDate).toLocaleDateString('es-AR')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Check-out:</span>
              <span className="font-medium">{new Date(formData.checkOutDate).toLocaleDateString('es-AR')}</span>
            </div>
            <div className="border-t pt-3 flex justify-between">
              <span className="text-lg font-semibold">Total:</span>
              <span className="text-2xl font-bold text-primary-600">${formData.selectedRoom?.precioTotal}</span>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handlePrint}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium flex items-center justify-center"
            >
              <Printer size={20} className="mr-2" />
              Imprimir Comprobante
            </button>
            <button
              onClick={() => navigate('/reservations')}
              className="flex-1 bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 font-medium"
            >
              Ver Todas las Reservas
            </button>
          </div>

          <p className="text-sm text-gray-500">
            Se ha enviado una confirmación al correo electrónico del cliente.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">Confirmar Reserva</h2>

        <div className="bg-gray-50 rounded-lg p-6 space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Cliente:</span>
            <span className="font-medium">{formData.client?.nombre} {formData.client?.apellido}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">DNI:</span>
            <span className="font-medium">{formData.client?.dni}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Habitación:</span>
            <span className="font-medium">{formData.selectedRoom?.numeroHabitacion}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Check-in:</span>
            <span className="font-medium">{formData.checkInDate}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Check-out:</span>
            <span className="font-medium">{formData.checkOutDate}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Noches:</span>
            <span className="font-medium">{formData.selectedRoom?.cantidadNoches}</span>
          </div>
          <div className="border-t pt-3 flex justify-between">
            <span className="text-lg font-semibold">Total:</span>
            <span className="text-2xl font-bold text-primary-600">${formData.selectedRoom?.precioTotal}</span>
          </div>
        </div>

        {createError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
            <div className="flex items-start">
              <AlertCircle size={18} className="mr-2 mt-0.5" />
              <div>
                <p className="font-medium mb-1">No se pudo confirmar la reserva</p>
                <p>{createError}</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-4">
          <button
            onClick={() => setCurrentStep(4)}
            className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 font-medium"
          >
            Volver
          </button>
          <button
            onClick={async () => {
              const ok = ensureNoDebt();
              if (!ok) return;
              setCreateError('');
              createReservationMutation.mutate();
            }}
            disabled={createReservationMutation.isPending}
            className="flex-1 bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 disabled:bg-gray-400 font-medium"
          >
            {createReservationMutation.isPending ? 'Creando...' : 'Confirmar Reserva'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {renderStepIndicator()}

          <div className="mt-8">
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
            {currentStep === 4 && renderStep4()}
            {currentStep === 5 && renderStep5()}
          </div>
        </div>
      </div>
      {showDebtModal && formData.client && (
        <SettleDebtModal
          clientId={formData.client.id}
          clientName={`${formData.client.nombre} ${formData.client.apellido}`}
          dni={formData.client.dni}
          initialInvoices={formData.client.invoices}
          onClose={() => setShowDebtModal(false)}
          onSettled={() => {
            setShowDebtModal(false);
            setCurrentStep(2);
          }}
        />
      )}
    </div>
  );
}
