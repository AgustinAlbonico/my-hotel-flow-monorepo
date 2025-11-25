import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit, Eye, UserX, Loader2, AlertCircle } from 'lucide-react';
import { listClients, deleteClient } from '../../api/clients.api';

/**
 * ClientsListPage Component
 * Lista y gestión de clientes del hotel
 */
export default function ClientsListPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Obtener clientes desde la API
  const {
    data: clients = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['clients'],
    queryFn: listClients,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  const filteredClients = clients.filter(
    (client) =>
      client.dni.includes(searchQuery) ||
      client.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedClient = selectedClientId
    ? clients.find((c) => c.id === selectedClientId)
    : null;

  const deleteMutation = useMutation({
    mutationFn: () => deleteClient(selectedClientId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setShowDeleteConfirm(false);
      setSelectedClientId(null);
    },
    onError: () => {
      alert('Error al dar de baja el cliente');
    },
  });

  const handleConfirmDelete = () => {
    if (!selectedClientId) return;
    deleteMutation.mutate();
  };

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
          <li className="text-gray-900 font-medium">Clientes</li>
        </ol>
      </nav>

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Clientes</h1>
          <p className="text-gray-600 mt-1">
            Lista de clientes registrados en el sistema
          </p>
        </div>
        <button
          onClick={() => navigate('/clients/create')}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center"
        >
          <Plus size={20} className="mr-2" />
          Crear Cliente
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por DNI, nombre o email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="bg-white rounded-lg shadow-md p-12 flex flex-col items-center justify-center">
          <Loader2 className="animate-spin text-primary-600 mb-4" size={48} />
          <p className="text-gray-600">Cargando clientes...</p>
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-start">
          <AlertCircle className="text-red-600 mr-3 flex-shrink-0" size={24} />
          <div>
            <h3 className="text-red-900 font-semibold mb-1">Error al cargar clientes</h3>
            <p className="text-red-700 text-sm">
              {error instanceof Error ? error.message : 'Ocurrió un error inesperado'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-3 text-sm text-red-600 hover:text-red-800 underline"
            >
              Reintentar
            </button>
          </div>
        </div>
      )}

      {/* Clients Table */}
      {!isLoading && !isError && (
        <>
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      DNI
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nombre Completo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Teléfono
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha Registro
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredClients.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                        {searchQuery
                          ? 'No se encontraron clientes con ese criterio'
                          : 'No hay clientes registrados'}
                      </td>
                    </tr>
                  ) : (
                    filteredClients.map((client) => (
                      <tr key={client.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {client.dni}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {client.firstName} {client.lastName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {client.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {client.phone || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              client.isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {client.isActive ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {new Date(client.createdAt).toLocaleDateString('es-AR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => navigate(`/clients/${client.id}`)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Ver detalles"
                            >
                              <Eye size={18} />
                            </button>
                            <button
                              onClick={() => navigate(`/clients/${client.id}/edit`)}
                              className="text-yellow-600 hover:text-yellow-900"
                              title="Editar"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedClientId(client.id);
                                setShowDeleteConfirm(true);
                              }}
                              className="text-red-600 hover:text-red-900"
                              title="Dar de baja"
                            >
                              <UserX size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Stats Footer */}
          <div className="mt-6 bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-blue-900">
                <span className="font-semibold">{filteredClients.length}</span> cliente
                {filteredClients.length !== 1 ? 's' : ''} encontrado
                {filteredClients.length !== 1 ? 's' : ''}
              </div>
              <div className="text-xs text-blue-700">
                Total en sistema: {clients.length}
              </div>
            </div>
          </div>
          {/* Confirmación de baja */}
          {showDeleteConfirm && selectedClient && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Confirmar Baja de Cliente
                </h3>
                <p className="text-gray-600 mb-6">
                  ¿Está seguro que desea dar de baja al cliente{' '}
                  <span className="font-semibold">
                    {selectedClient.firstName} {selectedClient.lastName}
                  </span>
                  ? Esta acción marcará el cliente como inactivo.
                </p>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setSelectedClientId(null);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    disabled={deleteMutation.isPending}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleConfirmDelete}
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
        </>
      )}
    </div>
  );
}
