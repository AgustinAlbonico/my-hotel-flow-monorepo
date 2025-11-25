/**
 * Users List Page - Listado de usuarios con paginación, búsqueda y filtros
 * Siguiendo MEJORES_PRACTICAS.md - Componentes funcionales
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useUsers } from '@/hooks/useUsers';
import { Can } from '@/components/auth/Can';
import { Plus, Edit, Trash2, Shield, Loader2, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const UsersListPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [isActiveFilter, setIsActiveFilter] = useState<string>('');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const { users, pagination, isLoading, deleteUser } = useUsers({
    page,
    limit,
    search: search || undefined,
    isActive: isActiveFilter ? isActiveFilter === 'true' : undefined,
  });

  const handleDelete = async (id: number, username: string) => {
    if (window.confirm(`¿Está seguro de eliminar al usuario "${username}"?`)) {
      try {
        setDeletingId(id);
        await deleteUser(id);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error al eliminar usuario';
        alert(errorMessage);
      } finally {
        setDeletingId(null);
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Usuarios</h1>
          <p className="text-gray-600 mt-1">
            Gestión de usuarios del sistema ({pagination?.total || 0} total)
          </p>
        </div>

        <Can perform="config.usuarios.crear">
          <Link to="/users/create" className="btn-primary flex items-center gap-2">
            <Plus size={20} />
            Crear Usuario
          </Link>
        </Can>
      </div>

      {/* Filtros y búsqueda */}
      <div className="card p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Búsqueda */}
          <div className="md:col-span-2">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Buscar
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="text-gray-400" size={20} />
              </div>
              <input
                id="search"
                type="text"
                placeholder="Buscar por usuario, email o nombre..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1); // Reset a primera página
                }}
                className="input pl-10"
              />
            </div>
          </div>

          {/* Filtro por estado */}
          <div>
            <label htmlFor="isActiveFilter" className="block text-sm font-medium text-gray-700 mb-1">
              Estado
            </label>
            <select
              id="isActiveFilter"
              value={isActiveFilter}
              onChange={(e) => {
                setIsActiveFilter(e.target.value);
                setPage(1);
              }}
              className="input"
            >
              <option value="">Todos</option>
              <option value="true">Activos</option>
              <option value="false">Inactivos</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Grupos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha Alta
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Loader2 className="animate-spin text-primary-600 mb-3" size={48} />
                      <p className="text-sm text-gray-500">Cargando usuarios...</p>
                    </div>
                  </td>
                </tr>
              ) : users && users.length > 0 ? (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{user.username}</div>
                      {user.fullName && (
                        <div className="text-sm text-gray-500">{user.fullName}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {user.groups && user.groups.length > 0 ? (
                          user.groups.map((group) => (
                            <span
                              key={group.id}
                              className="inline-flex items-center px-2 py-1 text-xs font-medium bg-primary-100 text-primary-700 rounded"
                            >
                              {group.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm text-gray-400">Sin grupos</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`badge ${
                          user.isActive ? 'badge-success' : 'badge-error'
                        }`}
                      >
                        {user.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {format(new Date(user.createdAt), 'dd MMM yyyy', { locale: es })}
                      </div>
                      <div className="text-xs text-gray-500">
                        {format(new Date(user.createdAt), 'HH:mm', { locale: es })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <Can perform="config.usuarios.modificar">
                          <Link
                            to={`/users/${user.id}/edit`}
                            className="text-primary-600 hover:text-primary-900 transition-colors"
                            title="Editar usuario"
                          >
                            <Edit size={18} />
                          </Link>
                        </Can>

                        <Can perform="config.usuarios.asignarGrupos">
                          <Link
                            to={`/users/${user.id}/permissions`}
                            className="text-accent-600 hover:text-accent-900 transition-colors"
                            title="Gestionar permisos"
                          >
                            <Shield size={18} />
                          </Link>
                        </Can>

                        <Can perform="config.usuarios.eliminar">
                          <button
                            onClick={() => handleDelete(user.id, user.username)}
                            disabled={deletingId === user.id}
                            className="text-error-600 hover:text-error-900 transition-colors disabled:opacity-50"
                            title="Eliminar usuario"
                          >
                            {deletingId === user.id ? (
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
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="text-gray-400">
                      <p className="text-lg font-medium">No hay usuarios registrados</p>
                      <p className="text-sm mt-1">
                        {search || isActiveFilter
                          ? 'No se encontraron usuarios con los filtros aplicados'
                          : 'Comienza creando tu primer usuario'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {pagination && pagination.totalPages > 1 && (
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Mostrando{' '}
                <span className="font-medium">
                  {(pagination.page - 1) * pagination.limit + 1}
                </span>
                {' - '}
                <span className="font-medium">
                  {Math.min(pagination.page * pagination.limit, pagination.total)}
                </span>
                {' de '}
                <span className="font-medium">{pagination.total}</span> usuarios
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={!pagination.hasPreviousPage}
                  className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  <ChevronLeft size={16} />
                  Anterior
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                    .filter((pageNum) => {
                      // Mostrar primera página, última página, página actual y páginas adyacentes
                      return (
                        pageNum === 1 ||
                        pageNum === pagination.totalPages ||
                        Math.abs(pageNum - pagination.page) <= 1
                      );
                    })
                    .map((pageNum, idx, arr) => {
                      // Agregar "..." si hay saltos
                      const prevPageNum = arr[idx - 1];
                      const showEllipsis = prevPageNum && pageNum - prevPageNum > 1;

                      return (
                        <React.Fragment key={pageNum}>
                          {showEllipsis && (
                            <span className="px-2 text-gray-500">...</span>
                          )}
                          <button
                            onClick={() => setPage(pageNum)}
                            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                              pageNum === pagination.page
                                ? 'bg-primary-600 text-white'
                                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                            }`}
                          >
                            {pageNum}
                          </button>
                        </React.Fragment>
                      );
                    })}
                </div>

                <button
                  onClick={() => setPage((prev) => prev + 1)}
                  disabled={!pagination.hasNextPage}
                  className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  Siguiente
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};