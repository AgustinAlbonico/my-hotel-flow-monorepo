/**
 * Confirm Recover Password Page - Confirmar recuperación de contraseña con token
 * Siguiendo MEJORES_PRACTICAS.md - Validación con react-hook-form + Zod
 */
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { authApi } from '@/api/auth.api';
import { z } from 'zod';
import { AlertTriangle, CheckCircle, Lock, Loader2 } from 'lucide-react';

interface ApiErrorLike {
  response?: {
    data?: {
      message?: string;
    };
  };
}

const confirmRecoverSchema = z.object({
  newPassword: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(100, 'Máximo 100 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

type ConfirmRecoverFormData = z.infer<typeof confirmRecoverSchema>;

export const ConfirmRecoverPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ConfirmRecoverFormData>({
    resolver: zodResolver(confirmRecoverSchema),
  });

  // Verificar que exista el token
  useEffect(() => {
    if (!token) {
      setError('Token de recuperación no válido o expirado');
    }
  }, [token]);

  const onSubmit = async (data: ConfirmRecoverFormData) => {
    if (!token) {
      setError('Token de recuperación no válido');
      return;
    }

    try {
      setError(null);
      setSuccess(false);
      await authApi.recoverConfirm({
        token,
        newPassword: data.newPassword,
      });
      setSuccess(true);
      
      // Redirigir al login después de 3 segundos
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(
        (err as ApiErrorLike).response?.data?.message || 
        'Error al cambiar la contraseña. El token puede haber expirado.'
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary-600 mb-2">
            MyHotelFlow
          </h1>
          <p className="text-gray-600">Sistema de Reservas Hoteleras</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold mb-2">Nueva Contraseña</h2>
            <p className="text-sm text-gray-600">
              Ingresa tu nueva contraseña para completar la recuperación
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

          {success ? (
            <div className="bg-success-50 border-l-4 border-success-500 p-4 rounded-r-md">
              <div className="flex items-start">
                <CheckCircle className="text-success-500 mt-0.5 mr-3" size={20} />
                <div>
                  <p className="text-sm text-success-700 font-medium mb-1">
                    ¡Contraseña actualizada exitosamente!
                  </p>
                  <p className="text-sm text-success-600">
                    Serás redirigido al login en unos segundos...
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Nueva Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    id="newPassword"
                    type="password"
                    className="input pl-10"
                    placeholder="••••••••"
                    {...register('newPassword')}
                    disabled={!token}
                  />
                </div>
                {errors.newPassword && (
                  <p className="text-error-600 text-sm mt-1">{errors.newPassword.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmar Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    id="confirmPassword"
                    type="password"
                    className="input pl-10"
                    placeholder="••••••••"
                    {...register('confirmPassword')}
                    disabled={!token}
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="text-error-600 text-sm mt-1">{errors.confirmPassword.message}</p>
                )}
              </div>

              <div className="bg-primary-50 border-l-4 border-primary-500 p-4 rounded-r-md">
                <p className="text-sm text-primary-700">
                  <strong>Requisitos:</strong> La contraseña debe tener al menos 8 caracteres.
                </p>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !token}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {isSubmitting && <Loader2 className="animate-spin" size={18} />}
                {isSubmitting ? 'Actualizando...' : 'Actualizar Contraseña'}
              </button>

              <div className="text-center">
                <Link
                  to="/login"
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  Volver al login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
