/**
 * User Form Page - Crear/Editar usuario
 * Siguiendo MEJORES_PRACTICAS.md - Validación con react-hook-form + Zod
 */
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useParams } from 'react-router-dom';
import { useUsers } from '@/hooks/useUsers';
import { createUserSchema, CreateUserFormData } from '@/schemas/user.schema';
import { AlertTriangle, Loader2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';

interface ApiErrorLike {
  response?: {
    data?: {
      message?: string;
    };
  };
}

export const UserFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;

  const { useUser, createUser, updateUser, isCreating, isUpdating } = useUsers();
  const { data: user, isLoading: loadingUser } = useUser(id ? parseInt(id) : 0);
  const { success } = useToast();

  const [error, setError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
  });

  // Cargar datos del usuario si está editando
  useEffect(() => {
    if (user) {
      reset({
        username: user.username,
        email: user.email,
        fullName: user.fullName || '',
        isActive: user.isActive,
      });
    }
  }, [user, reset]);

  const onSubmit = async (data: CreateUserFormData) => {
    try {
      setError(null);
      if (isEditing && id) {
        await updateUser({
          id: parseInt(id),
          payload: {
            fullName: data.fullName,
            email: data.email,
            isActive: data.isActive,
          },
        });
        success('Usuario actualizado', `El usuario ha sido actualizado correctamente`);
      } else {
        await createUser({
          ...data,
        });
        success('Usuario creado', `El usuario ${data.username} ha sido creado correctamente`);
      }
      navigate('/users');
    } catch (err) {
      setError(
        (err as ApiErrorLike).response?.data?.message ||
          `Error al ${isEditing ? 'actualizar' : 'crear'} usuario`
      );
    }
  };

  if (isEditing && loadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-primary-600" size={48} />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <button
        onClick={() => navigate('/users')}
        className="btn-ghost flex items-center gap-2 mb-6"
      >
        <ArrowLeft size={20} />
        Volver a usuarios
      </button>

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          {isEditing ? 'Editar Usuario' : 'Crear Usuario'}
        </h1>
        <p className="text-gray-600 mt-1">
          {isEditing
            ? 'Actualiza la información del usuario'
            : 'Completa los datos del nuevo usuario'}
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
          {/* Username */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              Usuario <span className="text-error-500">*</span>
            </label>
            <input
              id="username"
              type="text"
              className="input"
              placeholder="usuario123"
              disabled={isEditing}
              {...register('username')}
            />
            {errors.username && (
              <p className="text-error-600 text-sm mt-1">{errors.username.message}</p>
            )}
            {isEditing && (
              <p className="text-sm text-gray-500 mt-1">
                El usuario no puede modificarse una vez creado
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email <span className="text-error-500">*</span>
            </label>
            <input
              id="email"
              type="email"
              className="input"
              placeholder="usuario@hotel.com"
              {...register('email')}
            />
            {errors.email && (
              <p className="text-error-600 text-sm mt-1">{errors.email.message}</p>
            )}
          </div>

          {/* Full Name */}
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
              Nombre Completo
            </label>
            <input
              id="fullName"
              type="text"
              className="input"
              placeholder="Juan Pérez"
              {...register('fullName')}
            />
            {errors.fullName && (
              <p className="text-error-600 text-sm mt-1">{errors.fullName.message}</p>
            )}
          </div>

          {/* Password (solo en creación) */}
          {!isEditing && (
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                className="input"
                placeholder="••••••••"
                {...register('password')}
              />
              {errors.password && (
                <p className="text-error-600 text-sm mt-1">{errors.password.message}</p>
              )}
              <p className="text-sm text-gray-500 mt-1">
                Si no especificas una contraseña, se generará una automáticamente
              </p>
            </div>
          )}

          {/* Is Active (solo en edición) */}
          {isEditing && (
            <div className="flex items-start p-4 bg-gray-50 rounded-lg">
              <input
                id="isActive"
                type="checkbox"
                className="w-4 h-4 mt-0.5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                {...register('isActive')}
              />
              <div className="ml-3">
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                  Usuario activo
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Los usuarios inactivos no podrán iniciar sesión en el sistema
                </p>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => navigate('/users')}
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
              {isEditing ? 'Actualizar Usuario' : 'Crear Usuario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
