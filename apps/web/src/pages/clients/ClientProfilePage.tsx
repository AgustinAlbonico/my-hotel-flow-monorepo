import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  Edit,
  UserX,
  Loader2,
  AlertCircle,
  User,
  CreditCard,
  CheckCircle,
  XCircle,
  FileText,
} from 'lucide-react';
import { getClientById, deleteClient } from '../../api/clients.api';
import { ClientReservationHistory } from '@/components/clients/ClientReservationHistory';

/**
 * ClientProfilePage Component
 * Muestra el perfil completo de un cliente
 */
export default function ClientProfilePage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const {
    data: client,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['client', id],
    queryFn: () => getClientById(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteClient(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      navigate('/clients');
    },
    onError: () => {
      alert('Error al dar de baja el cliente');
    },
  });

  const handleDelete = () => {
    deleteMutation.mutate();
    setShowDeleteConfirm(false);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-lg shadow-md p-12 flex flex-col items-center justify-center">
          <Loader2 className="animate-spin text-primary-600 mb-4" size={48} />
          <p className="text-gray-600">Cargando perfil del cliente...</p>
        </div>
      </div>
    );
  }

  if (isError || !client) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-start">
          <AlertCircle className="text-red-600 mr-3 flex-shrink-0" size={24} />
          <div>
            <h3 className="text-red-900 font-semibold mb-1">
              Error al cargar el perfil
            </h3>
            <p className="text-red-700 text-sm">
              {error instanceof Error
                ? error.message
                : 'No se pudo cargar la información del cliente'}
            </p>
            <button
              onClick={() => navigate('/clients')}
              className="mt-3 text-sm text-red-600 hover:text-red-800 underline"
            >
              Volver a la lista de clientes
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-600 mb-4">
        <ol className="flex items-center space-x-2">
          <li>
            <button
              onClick={() => navigate('/dashboard')}
              className="hover:text-primary-600"
            >
              Dashboard
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
          <li className="text-gray-900 font-medium">
            {client.firstName} {client.lastName}
          </li>
        </ol>
      </nav>

      {/* Header con botones de acción */}
      <div className="flex justify-between items-start mb-6">
        <button
          onClick={() => navigate('/clients')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft size={20} className="mr-2" />
          Volver a la lista
        </button>

        <div className="flex space-x-3">
          <button
            onClick={() => navigate(`/clients/${id}/edit`)}
            className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 flex items-center"
          >
            <Edit size={18} className="mr-2" />
            Editar
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center"
            disabled={deleteMutation.isPending}
          >
            <UserX size={18} className="mr-2" />
            Dar de Baja
          </button>
        </div>
      </div>

      {/* Modal de confirmación de eliminación */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Confirmar Baja de Cliente
            </h3>
            <p className="text-gray-600 mb-6">
              ¿Está seguro que desea dar de baja al cliente{' '}
              <span className="font-semibold">
                {client.firstName} {client.lastName}
              </span>
              ? Esta acción marcará el cliente como inactivo.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                disabled={deleteMutation.isPending}
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? (
                  <>
                    <Loader2 className="animate-spin mr-2" size={18} />
                    Procesando...
                  </>
                ) : (
                  'Confirmar Baja'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Perfil del cliente */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna izquierda - Información principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card de información personal */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-6">
              <div className="bg-primary-100 p-3 rounded-full mr-4">
                <User className="text-primary-600" size={32} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {client.firstName} {client.lastName}
                </h2>
                <div className="flex items-center mt-1">
                  {client.isActive ? (
                    <span className="flex items-center text-green-600 text-sm">
                      <CheckCircle size={16} className="mr-1" />
                      Activo
                    </span>
                  ) : (
                    <span className="flex items-center text-red-600 text-sm">
                      <XCircle size={16} className="mr-1" />
                      Inactivo
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* DNI */}
              <div className="flex items-start">
                <CreditCard
                  className="text-gray-400 mr-3 flex-shrink-0"
                  size={20}
                />
                <div>
                  <p className="text-sm text-gray-500">DNI</p>
                  <p className="text-gray-900 font-medium">{client.dni}</p>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start">
                <Mail
                  className="text-gray-400 mr-3 flex-shrink-0"
                  size={20}
                />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="text-gray-900 font-medium break-all">
                    {client.email}
                  </p>
                </div>
              </div>

              {/* Teléfono */}
              <div className="flex items-start">
                <Phone
                  className="text-gray-400 mr-3 flex-shrink-0"
                  size={20}
                />
                <div>
                  <p className="text-sm text-gray-500">Teléfono</p>
                  <p className="text-gray-900 font-medium">
                    {client.phone || 'No especificado'}
                  </p>
                </div>
              </div>

              {/* Fecha de nacimiento */}
              {client.birthDate && (
                <div className="flex items-start">
                  <Calendar
                    className="text-gray-400 mr-3 flex-shrink-0"
                    size={20}
                  />
                  <div>
                    <p className="text-sm text-gray-500">Fecha de Nacimiento</p>
                    <p className="text-gray-900 font-medium">
                      {new Date(client.birthDate).toLocaleDateString('es-AR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              )}

              {/* Nacionalidad */}
              {client.nationality && (
                <div className="flex items-start">
                  <User
                    className="text-gray-400 mr-3 flex-shrink-0"
                    size={20}
                  />
                  <div>
                    <p className="text-sm text-gray-500">Nacionalidad</p>
                    <p className="text-gray-900 font-medium">
                      {client.nationality}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Dirección completa (ocupar ancho completo si existe) */}
            {(client.address || client.city || client.country) && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">
                  Ubicación
                </h4>
                <div className="space-y-2">
                  {client.address && (
                    <p className="text-gray-900">{client.address}</p>
                  )}
                  {(client.city || client.country) && (
                    <p className="text-gray-700">
                      {[client.city, client.country]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Observaciones (ocupar ancho completo si existe) */}
            {client.observations && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">
                  Observaciones
                </h4>
                <p className="text-gray-600 text-sm whitespace-pre-line">
                  {client.observations}
                </p>
              </div>
            )}
          </div>

          {/* Metadatos del sistema */}
          <div className="bg-gray-50 rounded-lg p-4 text-xs text-gray-500 space-y-1">
            <div className="flex justify-between">
              <span>Fecha de registro:</span>
              <span className="font-medium">
                {new Date(client.createdAt).toLocaleDateString('es-AR')}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Última actualización:</span>
              <span className="font-medium">
                {new Date(client.updatedAt).toLocaleDateString('es-AR')}
              </span>
            </div>
          </div>

          {/* Card de historial de reservas */}
          <ClientReservationHistory clientId={client.id} />
        </div>

        {/* Columna derecha - Resumen y acciones rápidas */}
        <div className="space-y-6">
          {/* Botón de Estado de Cuenta */}
          <Link
            to={`/account-statement/${client.id}`}
            className="block bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg shadow-md p-6 hover:from-blue-700 hover:to-blue-800 transition-all transform hover:scale-105"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FileText size={24} className="mr-3" />
                <div>
                  <h3 className="font-semibold text-lg">Estado de Cuenta</h3>
                  <p className="text-blue-100 text-sm">Ver movimientos</p>
                </div>
              </div>
              <ArrowLeft size={20} className="transform rotate-180" />
            </div>
          </Link>

          {/* Card de estadísticas */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Estadísticas
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b">
                <span className="text-sm text-gray-600">Total Reservas</span>
                <span className="font-semibold text-gray-900">0</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b">
                <span className="text-sm text-gray-600">Reservas Activas</span>
                <span className="font-semibold text-gray-900">0</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">
                  Última Estadía
                </span>
                <span className="font-semibold text-gray-900">-</span>
              </div>
            </div>
          </div>

          {/* Card de información del sistema */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Información del Sistema
            </h3>
            <div className="space-y-2 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>ID:</span>
                <span className="font-mono">{client.id}</span>
              </div>
              <div className="flex justify-between">
                <span>Creado:</span>
                <span>
                  {new Date(client.createdAt).toLocaleDateString('es-AR')}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Última actualización:</span>
                <span>
                  {new Date(client.updatedAt).toLocaleDateString('es-AR')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
