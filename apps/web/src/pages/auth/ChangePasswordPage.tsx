/**
 * Change Password Page - Página de cambio de contraseña
 * Siguiendo MEJORES_PRACTICAS.md - Validación con react-hook-form + Zod
 */
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { changePasswordSchema, ChangePasswordFormData } from '@/schemas/auth.schema';
import { CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';

interface ApiErrorLike {
  response?: {
    data?: {
      message?: string;
    };
  };
}

export const ChangePasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { changePassword } = useAuth();
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  });

  const onSubmit = async (data: ChangePasswordFormData) => {
    try {
      setError(null);
      setSuccess(false);
      await changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      setSuccess(true);
      reset();

      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err) {
      const apiError = err as ApiErrorLike;
      setError(apiError.response?.data?.message || 'Error al cambiar contraseña');
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Cambiar Contraseña</h1>

      {success && (
        <div className="bg-success-50 border-l-4 border-success-500 p-4 rounded-r-md mb-6">
          <div className="flex items-start">
            <CheckCircle className="text-success-500 mt-0.5 mr-3" size={20} />
            <p className="text-sm text-success-700">
              Contraseña cambiada exitosamente. Redirigiendo...
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-error-50 border-l-4 border-error-500 p-4 rounded-r-md mb-6">
          <div className="flex items-start">
            <AlertTriangle className="text-error-500 mt-0.5 mr-3" size={20} />
            <p className="text-sm text-error-700">{error}</p>
          </div>
        </div>
      )}

      <div className="card p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña Actual
            </label>
            <input
              id="currentPassword"
              type="password"
              className="input"
              {...register('currentPassword')}
            />
            {errors.currentPassword && (
              <p className="text-error-600 text-sm mt-1">{errors.currentPassword.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Nueva Contraseña
            </label>
            <input
              id="newPassword"
              type="password"
              className="input"
              {...register('newPassword')}
            />
            {errors.newPassword && (
              <p className="text-error-600 text-sm mt-1">{errors.newPassword.message}</p>
            )}
            <p className="text-sm text-gray-500 mt-1">
              Mínimo 8 caracteres con mayúsculas, minúsculas, números y símbolos
            </p>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirmar Nueva Contraseña
            </label>
            <input
              id="confirmPassword"
              type="password"
              className="input"
              {...register('confirmPassword')}
            />
            {errors.confirmPassword && (
              <p className="text-error-600 text-sm mt-1">{errors.confirmPassword.message}</p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn-secondary flex-1"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {isSubmitting && <Loader2 className="animate-spin" size={18} />}
              {isSubmitting ? 'Cambiando...' : 'Cambiar Contraseña'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
