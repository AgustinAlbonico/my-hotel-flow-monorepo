/**
 * User Permissions Page - Gestión de permisos de usuario
 * Siguiendo MEJORES_PRACTICAS.md - Componentes funcionales
 */
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useUsers } from '@/hooks/useUsers';
import { useGroups } from '@/hooks/useGroups';
import { useActions } from '@/hooks/useActions';
import { AlertTriangle, Loader2, ArrowLeft, CheckCircle } from 'lucide-react';

export const UserPermissionsPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const userId = id ? parseInt(id) : 0;

  const { useUser, setGroups: setUserGroups, setActions: setUserActions } = useUsers();
  const { data: user, isLoading: loadingUser } = useUser(userId);
  const { groups, isLoading: loadingGroups } = useGroups();
  const { actions, isLoading: loadingActions } = useActions();

  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [selectedActions, setSelectedActions] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Calcular acciones heredadas dinámicamente basándose en los grupos ACTUALMENTE seleccionados
  const inheritedActions = useMemo(() => {
    if (!groups || !selectedGroups.length) return [];
    
    const inheritedActionsMap = new Map();
    const selectedGroupObjects = groups.filter((g) => selectedGroups.includes(g.key));
    
    for (const group of selectedGroupObjects) {
      if (group.actions) {
        for (const action of group.actions) {
          inheritedActionsMap.set(action.key, action);
        }
      }
    }
    
    return Array.from(inheritedActionsMap.values());
  }, [groups, selectedGroups]);

  // Filtrar acciones disponibles: excluir las que ya están heredadas de los grupos seleccionados
  const availableActions = useMemo(() => {
    if (!actions || !inheritedActions) return actions || [];
    
    const inheritedKeys = new Set(inheritedActions.map((a) => a.key));
    return actions.filter((action) => !inheritedKeys.has(action.key));
  }, [actions, inheritedActions]);

  // Cargar grupos y acciones seleccionados del usuario
  useEffect(() => {
    if (user) {
      setSelectedGroups(user.groups?.map((g) => g.key) || []);
      setSelectedActions(user.actions?.map((a) => a.key) || []);
    }
  }, [user]);

  // Limpiar acciones directas que ahora están heredadas cuando cambian los grupos seleccionados
  useEffect(() => {
    if (inheritedActions.length > 0) {
      const inheritedKeys = new Set(inheritedActions.map((a) => a.key));
      setSelectedActions((prev) => prev.filter((key) => !inheritedKeys.has(key)));
    }
  }, [inheritedActions]);

  const handleGroupToggle = (groupKey: string) => {
    setSelectedGroups((prev) =>
      prev.includes(groupKey) ? prev.filter((k) => k !== groupKey) : [...prev, groupKey]
    );
  };

  const handleActionToggle = (actionKey: string) => {
    setSelectedActions((prev) =>
      prev.includes(actionKey) ? prev.filter((k) => k !== actionKey) : [...prev, actionKey]
    );
  };

  const handleSave = async () => {
    try {
      setError(null);
      setSuccess(false);
      setIsSaving(true);

      // Convertir group keys a group IDs
      const groupIds = groups
        ?.filter((g) => selectedGroups.includes(g.key))
        .map((g) => g.id) || [];

      // Guardar grupos
      await setUserGroups({ id: userId, payload: { groupIds } });

      // Guardar acciones (el backend acepta actionKeys)
      await setUserActions({ id: userId, payload: { actionKeys: selectedActions } });

      setSuccess(true);
      setTimeout(() => {
        navigate('/users');
      }, 2000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al guardar permisos';
      setError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  if (loadingUser || loadingGroups || loadingActions) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-primary-600" size={48} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center text-gray-500">Usuario no encontrado</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <button
        onClick={() => navigate('/users')}
        className="btn-ghost flex items-center gap-2 mb-6"
      >
        <ArrowLeft size={20} />
        Volver a usuarios
      </button>

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Permisos de Usuario</h1>
        <p className="text-gray-600 mt-1">
          Gestionar grupos y acciones para <strong>{user.username}</strong>
        </p>
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
              Permisos guardados exitosamente. Redirigiendo...
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Grupos */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold mb-4">Grupos</h2>
          <p className="text-sm text-gray-600 mb-4">
            Selecciona los grupos a los que pertenece el usuario
          </p>

          {groups && groups.length > 0 ? (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {groups.map((group) => (
                <label
                  key={group.id}
                  className="flex items-start p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedGroups.includes(group.key)}
                    onChange={() => handleGroupToggle(group.key)}
                    className="mt-1 w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <div className="ml-3 flex-1">
                    <div className="font-medium text-gray-900">{group.name}</div>
                    <div className="text-sm text-gray-500">{group.key}</div>
                    {group.description && (
                      <div className="text-sm text-gray-600 mt-1">{group.description}</div>
                    )}
                  </div>
                </label>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No hay grupos disponibles</p>
          )}
        </div>

        {/* Acciones */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold mb-4">Acciones Directas</h2>
          <p className="text-sm text-gray-600 mb-4">
            Selecciona acciones específicas para el usuario
          </p>
          {inheritedActions && inheritedActions.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
              <p className="text-sm text-blue-700">
                ℹ️ Las acciones heredadas de los grupos no se muestran aquí para evitar duplicados.
                El usuario ya tiene <strong>{inheritedActions.length}</strong> acción(es) desde sus grupos.
              </p>
            </div>
          )}

          {availableActions && availableActions.length > 0 ? (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {availableActions.map((action) => (
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
                    <div className="text-sm text-gray-500">{action.key}</div>
                    {action.description && (
                      <div className="text-sm text-gray-600 mt-1">{action.description}</div>
                    )}
                  </div>
                </label>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">
              {inheritedActions && inheritedActions.length > 0
                ? 'Todas las acciones ya están cubiertas por los grupos del usuario'
                : 'No hay acciones disponibles'}
            </p>
          )}
        </div>
      </div>

      {/* Botones */}
      <div className="flex gap-3 mt-6">
        <button
          type="button"
          onClick={() => navigate('/users')}
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
          Guardar Permisos
        </button>
      </div>
    </div>
  );
};
