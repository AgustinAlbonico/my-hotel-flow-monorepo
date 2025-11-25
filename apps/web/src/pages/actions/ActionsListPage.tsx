/**
 * Actions List Page - Listado de acciones
 * Siguiendo MEJORES_PRACTICAS.md - Componentes funcionales
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useActions } from '@/hooks/useActions';
import { Can } from '@/components/auth/Can';
import { Plus, Edit, Trash2, Loader2, Search } from 'lucide-react';

interface ApiErrorLike {
  response?: {
    data?: {
      message?: string;
    };
  };
}

export const ActionsListPage: React.FC = () => {
  const { actions, isLoading, deleteAction } = useActions();
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = React.useState<number | null>(null);

  const handleDelete = async (id: number, name: string) => {
    if (window.confirm(`¿Está seguro de eliminar la acción "${name}"?`)) {
      try {
        setDeletingId(id);
        await deleteAction(id);
      } catch (error) {
        alert(
          (error as ApiErrorLike).response?.data?.message ||
            'Error al eliminar acción'
        );
      } finally {
        setDeletingId(null);
      }
    }
  };

  // Filtrar acciones
  const filteredActions = React.useMemo(() => {
    if (!actions) return [];
    
    return actions.filter((action) => {
      const matchesSearch =
        searchTerm === '' ||
        action.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        action.key.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesSearch;
    });
  }, [actions, searchTerm]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-primary-600" size={48} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Acciones</h1>
          <p className="text-gray-600 mt-1">Gestión de acciones y permisos del sistema</p>
        </div>

        <Can perform="config.acciones.crear">
          <Link to="/actions/create" className="btn-primary flex items-center gap-2">
            <Plus size={20} />
            Crear Acción
          </Link>
        </Can>
      </div>

      {/* Filtros */}
      <div className="card p-4 mb-6">
        <div className="grid grid-cols-1 gap-4">
          {/* Búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por nombre o clave..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
        </div>

        <div className="mt-2 text-sm text-gray-600">
          Mostrando {filteredActions.length} de {actions?.length || 0} acciones
        </div>
      </div>

      {/* Tabla */}
      <div className="card overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acción
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Clave
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Operaciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredActions.length > 0 ? (
              filteredActions.map((action) => (
                <tr key={action.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{action.name}</div>
                    {action.description && (
                      <div className="text-sm text-gray-500 max-w-md truncate">
                        {action.description}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded text-gray-800">
                      {action.key}
                    </code>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <Can perform="config.acciones.modificar">
                        <Link
                          to={`/actions/${action.id}/edit`}
                          className="text-primary-600 hover:text-primary-900 transition-colors"
                          title="Editar acción"
                        >
                          <Edit size={18} />
                        </Link>
                      </Can>

                      <Can perform="config.acciones.eliminar">
                        <button
                          onClick={() => handleDelete(action.id, action.name)}
                          disabled={deletingId === action.id}
                          className="text-error-600 hover:text-error-900 transition-colors disabled:opacity-50"
                          title="Eliminar acción"
                        >
                          {deletingId === action.id ? (
                            <Loader2 size={18} className="animate-spin" />
                          ) : (
                            <Trash2 size={18} />
                          )}
                        </button>
                      </Can>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="px-6 py-12 text-center">
                  <div className="text-gray-400">
                    <p className="text-lg font-medium">
                      {searchTerm
                        ? 'No se encontraron acciones con los filtros aplicados'
                        : 'No hay acciones registradas'}
                    </p>
                    <p className="text-sm mt-1">
                      {searchTerm
                        ? 'Intenta ajustar los filtros'
                        : 'Comienza creando tu primera acción'}
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
