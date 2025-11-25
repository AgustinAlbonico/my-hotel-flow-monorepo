/**
 * Group Actions View Page - Vista de solo lectura de acciones de grupo
 * Siguiendo MEJORES_PRACTICAS.md - Componentes funcionales
 */
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useGroups } from '@/hooks/useGroups';
import { Loader2, ArrowLeft, Shield } from 'lucide-react';

export const GroupActionsViewPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const groupId = id ? parseInt(id) : 0;

  const { useGroup } = useGroups();
  const { data: group, isLoading: loadingGroup } = useGroup(groupId);

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

  const groupActions = group.actions || [];

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
        <div className="flex items-center gap-3 mb-2">
          <Shield className="text-primary-600" size={32} />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Acciones del Grupo</h1>
          </div>
        </div>
        <p className="text-gray-600 mt-1">
          Vista de acciones incluidas en <strong>{group.name}</strong>
        </p>
        <code className="text-sm bg-gray-100 px-2 py-1 rounded text-gray-800 mt-2 inline-block">
          {group.key}
        </code>
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">
            Acciones Incluidas ({groupActions.length})
          </h2>
        </div>

        {groupActions.length > 0 ? (
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {groupActions.map((action) => (
              <div
                key={action.id}
                className="flex items-start p-4 border border-gray-200 rounded-md bg-gray-50"
              >
                <div className="flex-shrink-0 mt-1">
                  <div className="w-4 h-4 rounded-full bg-success-500 flex items-center justify-center">
                    <svg
                      className="w-3 h-3 text-white"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                </div>
                <div className="ml-3 flex-1">
                  <div className="font-medium text-gray-900">{action.name}</div>
                  <code className="text-xs bg-white px-2 py-0.5 rounded text-gray-700 border border-gray-200">
                    {action.key}
                  </code>
                  {action.description && (
                    <div className="text-sm text-gray-600 mt-2">{action.description}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Shield className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-500">
              Este grupo no tiene acciones asignadas
            </p>
          </div>
        )}
      </div>

      {/* Botón de volver */}
      <div className="flex gap-3 mt-6">
        <button
          type="button"
          onClick={() => navigate('/groups')}
          className="btn-primary w-full"
        >
          Volver a Grupos
        </button>
      </div>
    </div>
  );
};
