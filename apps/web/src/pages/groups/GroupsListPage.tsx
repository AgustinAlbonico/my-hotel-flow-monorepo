/**
 * Groups List Page - Listado de grupos
 * Siguiendo MEJORES_PRACTICAS.md - Componentes funcionales
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { useGroups } from '@/hooks/useGroups';
import { Can } from '@/components/auth/Can';
import { Plus, Edit, Trash2, Shield, GitBranch, Loader2, Eye } from 'lucide-react';

export const GroupsListPage: React.FC = () => {
  const { groups, isLoading, deleteGroup } = useGroups();
  const [deletingId, setDeletingId] = React.useState<number | null>(null);

  const handleDelete = async (id: number, name: string) => {
    if (window.confirm(`¿Está seguro de eliminar el grupo "${name}"?`)) {
      try {
        setDeletingId(id);
        await deleteGroup(id);
      } catch (error) {
        let errorMessage = 'Error al eliminar grupo';
        if (error && typeof error === 'object' && 'response' in error) {
          const response = (error as { response?: { data?: { message?: string } } }).response;
          errorMessage = response?.data?.message || errorMessage;
        }
        alert(errorMessage);
      } finally {
        setDeletingId(null);
      }
    }
  };

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
          <h1 className="text-3xl font-bold text-gray-900">Grupos</h1>
          <p className="text-gray-600 mt-1">Gestión de grupos y permisos del sistema</p>
        </div>

        <Can perform="config.grupos.crear">
          <Link to="/groups/create" className="btn-primary flex items-center gap-2">
            <Plus size={20} />
            Crear Grupo
          </Link>
        </Can>
      </div>

      <div className="card overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Grupo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Clave
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Grupos Hijos
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Operaciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {groups && groups.length > 0 ? (
              groups.map((group) => (
                <tr key={group.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{group.name}</div>
                    {group.description && (
                      <div className="text-sm text-gray-500">{group.description}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded text-gray-800">
                      {group.key}
                    </code>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {group.actions && group.actions.length > 0 ? (
                        <>
                          {group.actions.slice(0, 3).map((action) => (
                            <span
                              key={action.id}
                              className="inline-flex items-center px-2 py-1 text-xs font-medium bg-success-100 text-success-700 rounded"
                            >
                              {action.name}
                            </span>
                          ))}
                          {group.actions.length > 3 && (
                            <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded">
                              +{group.actions.length - 3} más
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-sm text-gray-400">Sin acciones</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {group.children && group.children.length > 0 ? (
                        <>
                          {group.children.slice(0, 2).map((child) => (
                            <span
                              key={child.id}
                              className="inline-flex items-center px-2 py-1 text-xs font-medium bg-primary-100 text-primary-700 rounded"
                            >
                              {child.name}
                            </span>
                          ))}
                          {group.children.length > 2 && (
                            <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded">
                              +{group.children.length - 2} más
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-sm text-gray-400">Sin grupos hijos</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      {/* Botón para ver acciones - disponible para todos */}
                      <Link
                        to={`/groups/${group.id}/actions/view`}
                        className="text-blue-600 hover:text-blue-900 transition-colors"
                        title="Ver acciones del grupo"
                      >
                        <Eye size={18} />
                      </Link>

                      <Can perform="config.grupos.modificar">
                        <Link
                          to={`/groups/${group.id}/edit`}
                          className="text-primary-600 hover:text-primary-900 transition-colors"
                          title="Editar grupo"
                        >
                          <Edit size={18} />
                        </Link>
                      </Can>

                      <Can perform="config.grupos.asignarAcciones">
                        <Link
                          to={`/groups/${group.id}/actions`}
                          className="text-success-600 hover:text-success-900 transition-colors"
                          title="Gestionar acciones"
                        >
                          <Shield size={18} />
                        </Link>
                      </Can>

                      <Can perform="config.grupos.asignarGruposHijos">
                        <Link
                          to={`/groups/${group.id}/children`}
                          className="text-accent-600 hover:text-accent-900 transition-colors"
                          title="Gestionar grupos hijos"
                        >
                          <GitBranch size={18} />
                        </Link>
                      </Can>

                      <Can perform="config.grupos.eliminar">
                        <button
                          onClick={() => handleDelete(group.id, group.name)}
                          disabled={deletingId === group.id}
                          className="text-error-600 hover:text-error-900 transition-colors disabled:opacity-50"
                          title="Eliminar grupo"
                        >
                          {deletingId === group.id ? (
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
                <td colSpan={5} className="px-6 py-12 text-center">
                  <div className="text-gray-400">
                    <p className="text-lg font-medium">No hay grupos registrados</p>
                    <p className="text-sm mt-1">Comienza creando tu primer grupo</p>
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
