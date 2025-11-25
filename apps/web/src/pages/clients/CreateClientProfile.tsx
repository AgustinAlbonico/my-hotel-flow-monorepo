import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  createClientSchema,
  type CreateClientFormData,
} from '../../schemas/createClient.schema';
import {
  createClient,
  checkDniAvailability,
  type ClientCreatedResponse,
} from '../../api/clients.api';
import {
  CheckCircle,
  XCircle,
  Loader2,
  Copy,
  ArrowLeft,
  AlertCircle,
  UserPlus,
} from 'lucide-react';

/**
 * CreateClientProfile Component
 * Formulario en 3 pasos para crear perfil de cliente
 */
export default function CreateClientProfile() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect');
  const preloadedDni = searchParams.get('dni');

  const [currentStep, setCurrentStep] = useState(1);
  const [dniToCheck, setDniToCheck] = useState(preloadedDni || '');
  const [dniVerified, setDniVerified] = useState(false);
  const [dniAvailable, setDniAvailable] = useState<boolean | null>(null);
  const [createdClient, setCreatedClient] =
    useState<ClientCreatedResponse | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [passwordCopied, setPasswordCopied] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    watch,
  } = useForm<CreateClientFormData>({
    resolver: zodResolver(createClientSchema),
    mode: 'onChange',
  });

  // Query para verificar DNI
  const {
    refetch: checkDni,
    isLoading: isCheckingDni,
    error: dniCheckError,
    data: dniCheckData,
  } = useQuery({
    queryKey: ['check-dni', dniToCheck],
    queryFn: () => checkDniAvailability(dniToCheck),
    enabled: false,
  });

  // Effect para manejar resultado de verificación DNI
  useEffect(() => {
    if (dniCheckData) {
      setDniAvailable(!dniCheckData.exists);
      setDniVerified(true);
      if (!dniCheckData.exists) {
        setCurrentStep(2);
      }
    }
  }, [dniCheckData]);

  // Effect para verificar DNI automáticamente si viene pre-cargado
  useEffect(() => {
    if (preloadedDni && preloadedDni.length >= 7 && preloadedDni.length <= 8) {
      checkDni();
    }
  }, [preloadedDni, checkDni]);

  // Mutation para crear cliente
  const createClientMutation = useMutation({
    mutationFn: createClient,
    onSuccess: (data) => {
      setCreatedClient(data);
      setShowSuccessModal(true);
    },
  });

  const handleVerifyDni = () => {
    if (dniToCheck.length >= 7 && dniToCheck.length <= 8) {
      checkDni();
    }
  };

  const handleCreateClient = (data: CreateClientFormData) => {
    createClientMutation.mutate({
      dni: data.dni,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone || undefined,
      birthDate: data.birthDate || undefined,
      address: data.address || undefined,
      city: data.city || undefined,
      country: data.country || undefined,
      nationality: data.nationality || undefined,
      observations: data.observations || undefined,
      actionGroups: ['rol.cliente'], // Grupo de acciones asignado
    });
  };

  const copyPassword = () => {
    if (createdClient?.temporaryPassword) {
      navigator.clipboard.writeText(createdClient.temporaryPassword);
      setPasswordCopied(true);
      setTimeout(() => setPasswordCopied(false), 2000);
    }
  };

  const handleCreateReservation = () => {
    if (createdClient) {
      navigate(
        `/reservations/create?clientDni=${createdClient.dni}`,
      );
    }
  };

  const handleCreateAnother = () => {
    reset();
    setDniToCheck('');
    setDniVerified(false);
    setDniAvailable(null);
    setCreatedClient(null);
    setShowSuccessModal(false);
    setCurrentStep(1);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm">
          <ol className="flex items-center space-x-2 text-gray-600">
            <li>
              <button
                onClick={() => navigate('/')}
                className="hover:text-primary-600"
              >
                Inicio
              </button>
            </li>
            <li>/</li>
            <li>
              <button
                onClick={() => navigate('/clients')}
                className="hover:text-primary-600"
              >
                Clientes
              </button>
            </li>
            <li>/</li>
            <li className="text-gray-900 font-medium">Crear Perfil</li>
          </ol>
        </nav>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Crear Perfil de Cliente
          </h1>
          <p className="text-gray-600">
            Complete los datos para registrar un nuevo cliente en el sistema
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center flex-1">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    currentStep >= step
                      ? 'bg-primary-600 border-primary-600 text-white'
                      : 'bg-white border-gray-300 text-gray-400'
                  }`}
                >
                  {step}
                </div>
                {step < 3 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      currentStep > step ? 'bg-primary-600' : 'bg-gray-300'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-sm">
            <span className="text-gray-600">Verificar DNI</span>
            <span className="text-gray-600">Datos del Cliente</span>
            <span className="text-gray-600">Confirmación</span>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-lg shadow-md p-6">
          {/* Paso 1: Verificar DNI */}
          {currentStep === 1 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Paso 1: Verificar Disponibilidad de DNI
              </h2>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  DNI del Cliente
                </label>
                <input
                  type="text"
                  value={dniToCheck}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    if (value.length <= 8) {
                      setDniToCheck(value);
                      setDniVerified(false);
                      setDniAvailable(null);
                    }
                  }}
                  placeholder="Ej: 12345678"
                  maxLength={8}
                  disabled={!!preloadedDni}
                  className={`w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    preloadedDni ? 'bg-gray-100 cursor-not-allowed' : ''
                  }`}
                />
                {preloadedDni && (
                  <p className="mt-1 text-sm text-blue-600">
                    DNI pre-cargado desde el formulario de reserva
                  </p>
                )}
                {dniToCheck.length > 0 && dniToCheck.length < 7 && (
                  <p className="mt-1 text-sm text-error-600">
                    El DNI debe tener entre 7 y 8 dígitos
                  </p>
                )}
              </div>

              <button
                onClick={handleVerifyDni}
                disabled={
                  dniToCheck.length < 7 ||
                  dniToCheck.length > 8 ||
                  isCheckingDni
                }
                className="w-full bg-primary-600 text-white px-6 py-3 rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isCheckingDni ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  'Verificar Disponibilidad'
                )}
              </button>

              {dniVerified && dniAvailable === false && (
                <div className="mt-4 p-4 bg-error-50 border border-error-200 rounded-md flex items-start">
                  <XCircle className="w-5 h-5 text-error-600 mr-2 mt-0.5" />
                  <div>
                    <p className="text-error-800 font-medium">
                      DNI ya registrado
                    </p>
                    <p className="text-error-700 text-sm mt-1">
                      El DNI ingresado ya existe en el sistema
                    </p>
                    <button
                      onClick={() => navigate(`/clients?dni=${dniToCheck}`)}
                      className="mt-2 text-primary-600 hover:text-primary-700 text-sm font-medium"
                    >
                      Buscar cliente existente →
                    </button>
                  </div>
                </div>
              )}

              {dniVerified && dniAvailable === true && (
                <div className="mt-4 p-4 bg-success-50 border border-success-200 rounded-md flex items-center">
                  <CheckCircle className="w-5 h-5 text-success-600 mr-2" />
                  <p className="text-success-800 font-medium">
                    DNI disponible - Puede continuar
                  </p>
                </div>
              )}

              {dniCheckError && (
                <div className="mt-4 p-4 bg-error-50 border border-error-200 rounded-md flex items-start">
                  <AlertCircle className="w-5 h-5 text-error-600 mr-2 mt-0.5" />
                  <p className="text-error-800">
                    Error al verificar DNI. Intente nuevamente.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Paso 2: Formulario de datos */}
          {currentStep === 2 && (
            <form onSubmit={handleSubmit(() => setCurrentStep(3))}>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Paso 2: Datos del Cliente
              </h2>

              <input type="hidden" {...register('dni')} value={dniToCheck} />

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre *
                  </label>
                  <input
                    {...register('firstName')}
                    type="text"
                    placeholder="Ej: Juan"
                    className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 ${
                      errors.firstName ? 'border-error-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.firstName && (
                    <p className="mt-1 text-sm text-error-600">
                      {errors.firstName.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Apellido *
                  </label>
                  <input
                    {...register('lastName')}
                    type="text"
                    placeholder="Ej: Pérez"
                    className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 ${
                      errors.lastName ? 'border-error-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.lastName && (
                    <p className="mt-1 text-sm text-error-600">
                      {errors.lastName.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    {...register('email')}
                    type="email"
                    placeholder="ejemplo@correo.com"
                    className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 ${
                      errors.email ? 'border-error-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-error-600">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teléfono{' '}
                    <span className="text-gray-500 font-normal">(Opcional)</span>
                  </label>
                  <input
                    {...register('phone')}
                    type="tel"
                    placeholder="Ej: 1123456789"
                    className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 ${
                      errors.phone ? 'border-error-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.phone && (
                    <p className="mt-1 text-sm text-error-600">
                      {errors.phone.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Nacimiento{' '}
                    <span className="text-gray-500 font-normal">(Opcional)</span>
                  </label>
                  <input
                    {...register('birthDate')}
                    type="date"
                    className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 ${
                      errors.birthDate ? 'border-error-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.birthDate && (
                    <p className="mt-1 text-sm text-error-600">
                      {errors.birthDate.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dirección{' '}
                    <span className="text-gray-500 font-normal">(Opcional)</span>
                  </label>
                  <input
                    {...register('address')}
                    type="text"
                    placeholder="Ej: Av. Corrientes 1234"
                    maxLength={255}
                    className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 ${
                      errors.address ? 'border-error-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.address && (
                    <p className="mt-1 text-sm text-error-600">
                      {errors.address.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ciudad{' '}
                      <span className="text-gray-500 font-normal">(Opcional)</span>
                    </label>
                    <input
                      {...register('city')}
                      type="text"
                      placeholder="Ej: Buenos Aires"
                      maxLength={100}
                      className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 ${
                        errors.city ? 'border-error-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.city && (
                      <p className="mt-1 text-sm text-error-600">
                        {errors.city.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      País{' '}
                      <span className="text-gray-500 font-normal">(Opcional)</span>
                    </label>
                    <input
                      {...register('country')}
                      type="text"
                      placeholder="Ej: Argentina"
                      maxLength={100}
                      className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 ${
                        errors.country ? 'border-error-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.country && (
                      <p className="mt-1 text-sm text-error-600">
                        {errors.country.message}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nacionalidad{' '}
                    <span className="text-gray-500 font-normal">(Opcional)</span>
                  </label>
                  <input
                    {...register('nationality')}
                    type="text"
                    placeholder="Ej: Argentina"
                    maxLength={100}
                    className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 ${
                      errors.nationality ? 'border-error-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.nationality && (
                    <p className="mt-1 text-sm text-error-600">
                      {errors.nationality.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Observaciones{' '}
                    <span className="text-gray-500 font-normal">(Opcional)</span>
                  </label>
                  <textarea
                    {...register('observations')}
                    rows={3}
                    placeholder="Notas adicionales sobre el cliente..."
                    className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 ${
                      errors.observations ? 'border-error-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.observations && (
                    <p className="mt-1 text-sm text-error-600">
                      {errors.observations.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-6 flex space-x-4">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="flex-1 bg-white text-gray-700 px-6 py-3 rounded-md border border-gray-300 hover:bg-gray-50 flex items-center justify-center"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Volver
                </button>
                <button
                  type="submit"
                  disabled={!isValid}
                  className="flex-1 bg-primary-600 text-white px-6 py-3 rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continuar
                </button>
              </div>
            </form>
          )}

          {/* Paso 3: Confirmación */}
          {currentStep === 3 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Paso 3: Confirmación
              </h2>

              <div className="bg-gray-50 rounded-md p-4 mb-4">
                <h3 className="font-medium text-gray-900 mb-3">
                  Resumen de Datos
                </h3>
                <dl className="space-y-2">
                  <div className="flex">
                    <dt className="w-32 text-gray-600">DNI:</dt>
                    <dd className="text-gray-900 font-medium">{dniToCheck}</dd>
                  </div>
                  <div className="flex">
                    <dt className="w-32 text-gray-600">Nombre:</dt>
                    <dd className="text-gray-900 font-medium">
                      {watch('firstName')} {watch('lastName')}
                    </dd>
                  </div>
                  <div className="flex">
                    <dt className="w-32 text-gray-600">Email:</dt>
                    <dd className="text-gray-900 font-medium">
                      {watch('email')}
                    </dd>
                  </div>
                  {watch('phone') && (
                    <div className="flex">
                      <dt className="w-32 text-gray-600">Teléfono:</dt>
                      <dd className="text-gray-900 font-medium">
                        {watch('phone')}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>

              <div className="bg-info-50 border border-info-200 rounded-md p-4 mb-6">
                <p className="text-info-800 text-sm">
                  <strong>Contraseña temporal:</strong> Se generará
                  automáticamente una contraseña segura que será enviada al email
                  del cliente.
                </p>
              </div>

              {createClientMutation.error && (
                <div className="mb-4 p-4 bg-error-50 border border-error-200 rounded-md flex items-start">
                  <AlertCircle className="w-5 h-5 text-error-600 mr-2 mt-0.5" />
                  <div>
                    <p className="text-error-800 font-medium">
                      Error al crear cliente
                    </p>
                    <p className="text-error-700 text-sm mt-1">
                      {(
                        createClientMutation.error as {
                          response?: { data?: { error?: { message?: string } } };
                        }
                      )?.response?.data?.error?.message ||
                        'Ocurrió un error inesperado. Intente nuevamente.'}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  disabled={createClientMutation.isPending}
                  className="flex-1 bg-white text-gray-700 px-6 py-3 rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50 flex items-center justify-center"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Volver
                </button>
                <button
                  onClick={handleSubmit(handleCreateClient)}
                  disabled={createClientMutation.isPending}
                  className="flex-1 bg-primary-600 text-white px-6 py-3 rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {createClientMutation.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Creando cliente...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-5 h-5 mr-2" />
                      Crear Cliente
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal de Éxito */}
        {showSuccessModal && createdClient && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
              <div className="flex items-center justify-center w-16 h-16 bg-success-100 rounded-full mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-success-600" />
              </div>

              <h3 className="text-2xl font-bold text-center text-gray-900 mb-2">
                Cliente Creado Exitosamente
              </h3>

              <div className="bg-gray-50 rounded-md p-4 mb-4">
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-600">DNI:</dt>
                    <dd className="text-gray-900 font-medium">
                      {createdClient.dni}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Nombre:</dt>
                    <dd className="text-gray-900 font-medium">
                      {createdClient.firstName} {createdClient.lastName}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Email:</dt>
                    <dd className="text-gray-900 font-medium">
                      {createdClient.email}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="bg-warning-50 border border-warning-200 rounded-md p-4 mb-4">
                <p className="text-warning-800 text-sm font-medium mb-2">
                  Contraseña Temporal
                </p>
                <div className="flex items-center space-x-2">
                  <code className="flex-1 bg-white px-3 py-2 rounded border border-warning-300 text-lg font-mono">
                    {createdClient.temporaryPassword}
                  </code>
                  <button
                    onClick={copyPassword}
                    className="p-2 bg-white border border-warning-300 rounded hover:bg-warning-100"
                    title="Copiar contraseña"
                  >
                    {passwordCopied ? (
                      <CheckCircle className="w-5 h-5 text-success-600" />
                    ) : (
                      <Copy className="w-5 h-5 text-gray-600" />
                    )}
                  </button>
                </div>
                <p className="text-warning-700 text-xs mt-2">
                  ⚠️ Esta contraseña no se mostrará nuevamente
                </p>
              </div>

              <div className="space-y-2">
                {redirectTo === 'reservations' && (
                  <button
                    onClick={handleCreateReservation}
                    className="w-full bg-primary-600 text-white px-6 py-3 rounded-md hover:bg-primary-700"
                  >
                    Crear Reserva para este Cliente
                  </button>
                )}
                <button
                  onClick={() => navigate(`/clients/${createdClient.id}`)}
                  className="w-full bg-white text-primary-600 px-6 py-3 rounded-md border border-primary-600 hover:bg-primary-50"
                >
                  Ver Perfil del Cliente
                </button>
                <button
                  onClick={handleCreateAnother}
                  className="w-full bg-white text-gray-700 px-6 py-3 rounded-md border border-gray-300 hover:bg-gray-50"
                >
                  Crear Otro Cliente
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
