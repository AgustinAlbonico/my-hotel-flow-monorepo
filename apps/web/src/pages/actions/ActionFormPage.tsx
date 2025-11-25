/**
 * Action Form Page - Crear/Editar acción
 * Siguiendo MEJORES_PRACTICAS.md - Validación con react-hook-form + Zod
 */
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useParams } from 'react-router-dom';
import { useActions } from '@/hooks/useActions';
import { createActionSchema, CreateActionFormData } from '@/schemas/action.schema';
import { AlertTriangle, Loader2, ArrowLeft } from 'lucide-react';

interface ApiErrorLike {
  response?: {
    data?: {
      message?: string;
    };
  };
}

export const ActionFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;

  const { useAction, createAction, updateAction, isCreating, isUpdating } = useActions();
  const { data: action, isLoading: loadingAction } = useAction(id ? parseInt(id) : 0);

  const [error, setError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateActionFormData>({
    resolver: zodResolver(createActionSchema),
  });

  // Cargar datos de la acción si está editando
  useEffect(() => {
    if (action) {
      reset({
        key: action.key,
        name: action.name,
        description: action.description || '',
      });
    }
  }, [action, reset]);

  const onSubmit = async (data: CreateActionFormData) => {
    try {
      setError(null);
      if (isEditing && id) {
        await updateAction({
          id: parseInt(id),
          payload: data,
        });
      } else {
        await createAction(data);
      }
      navigate('/actions');
    } catch (err) {
      setError(
        (err as ApiErrorLike).response?.data?.message ||
          `Error al ${isEditing ? 'actualizar' : 'crear'} acción`
      );
    }
  };

  if (isEditing && loadingAction) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-primary-600" size={48} />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <button
        onClick={() => navigate('/actions')}
        className="btn-ghost flex items-center gap-2 mb-6"
      >
        <ArrowLeft size={20} />
        Volver a acciones
      </button>

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          {isEditing ? 'Editar Acción' : 'Crear Acción'}
        </h1>
        <p className="text-gray-600 mt-1">
          {isEditing
            ? 'Actualiza la información de la acción'
            : 'Completa los datos de la nueva acción'}
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

      <div className="card p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Key */}
          <div>
            <label htmlFor="key" className="block text-sm font-medium text-gray-700 mb-1">
              Clave <span className="text-error-500">*</span>
            </label>
            <input
              id="key"
              type="text"
              className="input font-mono"
              placeholder="config.usuarios.listar"
              {...register('key')}
            />
            {errors.key && (
              <p className="text-error-600 text-sm mt-1">{errors.key.message}</p>
            )}
            <p className="text-sm text-gray-500 mt-1">
              Solo minúsculas, números, puntos, guiones y guiones bajos
            </p>
          </div>

          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Nombre <span className="text-error-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              className="input"
              placeholder="Listar Usuarios"
              {...register('name')}
            />
            {errors.name && (
              <p className="text-error-600 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              id="description"
              rows={4}
              className="input"
              placeholder="Descripción de la acción y su propósito..."
              {...register('description')}
            />
            {errors.description && (
              <p className="text-error-600 text-sm mt-1">{errors.description.message}</p>
            )}
          </div>

          {/* Info adicional */}
          <div className="bg-primary-50 border-l-4 border-primary-500 p-4 rounded-r-md">
            <p className="text-sm text-primary-700">
              <strong>Nota:</strong> Las acciones se asignan a grupos, y los usuarios heredan las
              acciones de sus grupos. La clave debe ser única en todo el sistema y seguir el formato
              recomendado: modulo.categoria.operacion (ej: config.usuarios.listar)
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => navigate('/actions')}
              className="btn-secondary flex-1"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isCreating || isUpdating}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {(isCreating || isUpdating) && <Loader2 className="animate-spin" size={18} />}
              {isEditing ? 'Actualizar Acción' : 'Crear Acción'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
