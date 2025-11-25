import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Tag } from 'lucide-react';
import {
  listCaracteristicas,
  deleteCaracteristica,
  type Caracteristica,
} from '../../api/caracteristicas.api';
import { Can } from '../../components/auth/Can';
import CaracteristicaFormModal from '../../components/caracteristicas/CaracteristicaFormModal';

/**
 * CaracteristicasPage
 * Componente: Página de lista de características
 * Responsabilidad: Mostrar lista de características con acciones CRUD
 */
export default function CaracteristicasPage() {
  const queryClient = useQueryClient();
  const [showOnlyActive, setShowOnlyActive] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCaracteristica, setSelectedCaracteristica] =
    useState<Caracteristica | null>(null);

  // Cargar características
  const {
    data: caracteristicas,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['caracteristicas', showOnlyActive],
    queryFn: () => listCaracteristicas(showOnlyActive),
  });

  // Mutación para eliminar
  const deleteMutation = useMutation({
    mutationFn: deleteCaracteristica,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['caracteristicas'] });
    },
  });

  const handleDelete = async (id: number, nombre: string) => {
    if (
      window.confirm(`¿Está seguro de eliminar la característica "${nombre}"?`)
    ) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch {
        alert('Error al eliminar la característica');
      }
    }
  };

  const handleEdit = (caracteristica: Caracteristica) => {
    setSelectedCaracteristica(caracteristica);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedCaracteristica(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCaracteristica(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded">
        <p>Error al cargar características: {(error as Error).message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Características</h1>
          <p className="text-gray-600 mt-1">
            Gestiona las características disponibles para los tipos de
            habitación
          </p>
        </div>
        <Can perform={['habitaciones.crear']}>
          <button
            onClick={handleCreate}
            className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
          >
            <Plus className="w-5 h-5" />
            Nueva Característica
          </button>
        </Can>
      </div>

      {/* Filtro de estado */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <label className="flex items-center gap-2 cursor-pointer w-fit">
          <input
            type="checkbox"
            checked={showOnlyActive}
            onChange={(e) => setShowOnlyActive(e.target.checked)}
            className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 focus:ring-2"
          />
          <span className="text-sm font-medium text-gray-700">
            Mostrar solo características activas
          </span>
        </label>
      </div>

      {/* Lista de características */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {!caracteristicas || caracteristicas.length === 0 ? (
          <div className="p-8 text-center">
            <Tag className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">
              No hay características
              {showOnlyActive ? ' activas' : ''} registradas
            </p>
            <Can perform={['habitaciones.crear']}>
              <button
                onClick={handleCreate}
                className="mt-4 text-primary-600 hover:text-primary-700 font-medium"
              >
                Crear la primera característica
              </button>
            </Can>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descripción
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {caracteristicas.map((caracteristica) => (
                  <tr
                    key={caracteristica.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-primary-600" />
                        <span className="text-sm font-medium text-gray-900">
                          {caracteristica.nombre}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">
                        {caracteristica.descripcion || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          caracteristica.isActive
                            ? 'bg-success-100 text-success-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {caracteristica.isActive ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <Can perform={['habitaciones.modificar']}>
                          <button
                            onClick={() => handleEdit(caracteristica)}
                            className="text-primary-600 hover:text-primary-900 transition-colors p-1"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </Can>
                        <Can perform={['habitaciones.eliminar']}>
                          <button
                            onClick={() =>
                              handleDelete(
                                caracteristica.id,
                                caracteristica.nombre
                              )
                            }
                            className="text-error-600 hover:text-error-900 transition-colors p-1"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </Can>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de formulario */}
      {isModalOpen && (
        <CaracteristicaFormModal
          caracteristica={selectedCaracteristica}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
