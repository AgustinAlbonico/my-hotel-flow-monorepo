/**
 * Group Actions Page - Gestión de acciones de grupo
 * Siguiendo MEJORES_PRACTICAS.md - Componentes funcionales
 */
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useGroups } from '@/hooks/useGroups';
import { useActions } from '@/hooks/useActions';
import { AlertTriangle, Loader2, ArrowLeft, CheckCircle } from 'lucide-react';

interface ApiErrorLike {
  response?: {
    data?: {
      message?: string;
    };
  };
}

export const GroupActionsPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const groupId = id ? parseInt(id) : 0;

  const { useGroup, setActions: setGroupActions } = useGroups();
  const { data: group, isLoading: loadingGroup } = useGroup(groupId);
  const { actions, isLoading: loadingActions } = useActions();

  const [selectedActions, setSelectedActions] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Cargar acciones seleccionadas del grupo
  useEffect(() => {
    if (group) {
      setSelectedActions(group.actions?.map((a) => a.key) || []);
    }
  }, [group]);

  const handleActionToggle = (actionKey: string) => {
    setSelectedActions((prev) =>
      prev.includes(actionKey) ? prev.filter((k) => k !== actionKey) : [...prev, actionKey]
    );
  };

  const handleSelectAll = () => {
    if (actions) {
      setSelectedActions(actions.map((a) => a.key));
    }
  };

  const handleDeselectAll = () => {
    setSelectedActions([]);
  };

  const handleSave = async () => {
    try {
      setError(null);
      setSuccess(false);
      setIsSaving(true);

      await setGroupActions({ id: groupId, payload: { actionKeys: selectedActions } });

      setSuccess(true);
      setTimeout(() => {
        navigate('/groups');
      }, 2000);
    } catch (err) {
      const apiError = err as ApiErrorLike;
      setError(apiError.response?.data?.message || 'Error al guardar acciones');
    } finally {
      setIsSaving(false);
    }
  };

  if (loadingGroup || loadingActions) {
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
        <h1 className="text-3xl font-bold text-gray-900">Acciones del Grupo</h1>
        <p className="text-gray-600 mt-1">
          Gestionar acciones para <strong>{group.name}</strong>
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
              Acciones guardadas exitosamente. Redirigiendo...
            </p>
          </div>
        </div>
      )}

      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">
            Acciones Disponibles ({selectedActions.length} seleccionadas)
          </h2>
          <div className="flex gap-2">
            <button
              onClick={handleSelectAll}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              Seleccionar todas
            </button>
            <span className="text-gray-300">|</span>
            <button
              onClick={handleDeselectAll}
              className="text-sm text-gray-600 hover:text-gray-700 font-medium"
            >
              Deseleccionar todas
            </button>
          </div>
        </div>

        {actions && actions.length > 0 ? (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {actions.map((action) => (
              <label
                key={action.id}
                className="flex items-start p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedActions.includes(action.key)}
                  onChange={() => handleActionToggle(action.key)}
                  className="mt-1 w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <div className="ml-3 flex-1">
                  <div className="font-medium text-gray-900">{action.name}</div>
                  <code className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-700">
                    {action.key}
                  </code>
                  {action.description && (
                    <div className="text-sm text-gray-600 mt-1">{action.description}</div>
                  )}
                </div>
              </label>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">No hay acciones disponibles</p>
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
          Guardar Acciones
        </button>
      </div>
    </div>
  );
};
