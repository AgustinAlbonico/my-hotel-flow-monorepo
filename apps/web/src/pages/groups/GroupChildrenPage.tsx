/**
 * Group Children Page - Gestión de grupos hijos
 * Siguiendo MEJORES_PRACTICAS.md - Componentes funcionales
 */
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useGroups } from '@/hooks/useGroups';
import { AlertTriangle, Loader2, ArrowLeft, CheckCircle, Info } from 'lucide-react';

interface ApiErrorLike {
  response?: {
    data?: {
      message?: string;
    };
  };
}

export const GroupChildrenPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const groupId = id ? parseInt(id) : 0;

  const { useGroup, groups, setChildren: setGroupChildren } = useGroups();
  const { data: group, isLoading: loadingGroup } = useGroup(groupId);

  const [selectedChildren, setSelectedChildren] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Cargar grupos hijos seleccionados
  useEffect(() => {
    if (group) {
      setSelectedChildren(group.children?.map((c) => c.key) || []);
    }
  }, [group]);

  const handleChildToggle = (childKey: string) => {
    setSelectedChildren((prev) =>
      prev.includes(childKey) ? prev.filter((k) => k !== childKey) : [...prev, childKey]
    );
  };

  const handleSave = async () => {
    try {
      setError(null);
      setSuccess(false);
      setIsSaving(true);

      // Convertir child keys a child IDs
      const childrenIds = groups
        ?.filter((g) => selectedChildren.includes(g.key))
        .map((g) => g.id) || [];

      await setGroupChildren({ id: groupId, payload: { childrenIds } });

      setSuccess(true);
      setTimeout(() => {
        navigate('/groups');
      }, 2000);
    } catch (err) {
      const apiError = err as ApiErrorLike;
      setError(apiError.response?.data?.message || 'Error al guardar grupos hijos');
    } finally {
      setIsSaving(false);
    }
  };

  // Filtrar grupos disponibles (excluir el grupo actual y sus ancestros)
  const availableGroups = groups?.filter((g) => g.id !== groupId) || [];

  if (loadingGroup) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-primary-600" size={48} />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center text-gray-500">Grupo no encontrado</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <button
        onClick={() => navigate('/groups')}
        className="btn-ghost flex items-center gap-2 mb-6"
      >
        <ArrowLeft size={20} />
        Volver a grupos
      </button>

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Grupos Hijos</h1>
        <p className="text-gray-600 mt-1">
          Gestionar grupos hijos para <strong>{group.name}</strong>
        </p>
        <code className="text-sm bg-gray-100 px-2 py-1 rounded text-gray-800 mt-2 inline-block">
          {group.key}
        </code>
      </div>

      {error && (
        <div className="bg-error-50 border-l-4 border-error-500 p-4 rounded-r-md mb-6">
          <div className="flex items-start">
            <AlertTriangle className="text-error-500 mt-0.5 mr-3" size={20} />
            <p className="text-sm text-error-700">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-success-50 border-l-4 border-success-500 p-4 rounded-r-md mb-6">
          <div className="flex items-start">
            <CheckCircle className="text-success-500 mt-0.5 mr-3" size={20} />
            <p className="text-sm text-success-700">
              Grupos hijos guardados exitosamente. Redirigiendo...
            </p>
          </div>
        </div>
      )}

      {/* Información sobre herencia */}
      <div className="bg-primary-50 border-l-4 border-primary-500 p-4 rounded-r-md mb-6">
        <div className="flex items-start">
          <Info className="text-primary-600 mt-0.5 mr-3" size={20} />
          <div className="text-sm text-primary-700">
            <p className="font-medium mb-1">Herencia de Permisos</p>
            <p>
              Los grupos hijos heredan automáticamente todas las acciones del grupo padre.
              Un usuario en un grupo hijo tendrá todos los permisos del grupo padre más los permisos específicos del grupo hijo.
            </p>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">
            Grupos Disponibles ({selectedChildren.length} seleccionados)
          </h2>
        </div>

        {availableGroups && availableGroups.length > 0 ? (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {availableGroups.map((availableGroup) => (
              <label
                key={availableGroup.id}
                className="flex items-start p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedChildren.includes(availableGroup.key)}
                  onChange={() => handleChildToggle(availableGroup.key)}
                  className="mt-1 w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <div className="ml-3 flex-1">
                  <div className="font-medium text-gray-900">{availableGroup.name}</div>
                  <code className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-700">
                    {availableGroup.key}
                  </code>
                  {availableGroup.description && (
                    <div className="text-sm text-gray-600 mt-1">{availableGroup.description}</div>
                  )}
                  {availableGroup.actions && availableGroup.actions.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {availableGroup.actions.slice(0, 3).map((action) => (
                        <span
                          key={action.id}
                          className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-success-100 text-success-700 rounded"
                        >
                          {action.name}
                        </span>
                      ))}
                      {availableGroup.actions.length > 3 && (
                        <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded">
                          +{availableGroup.actions.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </label>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">No hay grupos disponibles</p>
        )}
      </div>

      {/* Botones */}
      <div className="flex gap-3 mt-6">
        <button
          type="button"
          onClick={() => navigate('/groups')}
          className="btn-secondary flex-1"
        >
          Cancelar
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving || success}
          className="btn-primary flex-1 flex items-center justify-center gap-2"
        >
          {isSaving && <Loader2 className="animate-spin" size={18} />}
          Guardar Grupos Hijos
        </button>
      </div>
    </div>
  );
};
