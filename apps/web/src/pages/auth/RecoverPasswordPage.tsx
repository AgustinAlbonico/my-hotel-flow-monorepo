/**
 * Recover Password Page - Solicitud de recuperación de contraseña
 * Siguiendo MEJORES_PRACTICAS.md - Validación con react-hook-form + Zod
 */
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { authApi } from '@/api/auth.api';
import { z } from 'zod';
import { AlertTriangle, CheckCircle, Mail, ArrowLeft, Loader2 } from 'lucide-react';

interface ApiErrorLike {
  response?: {
    data?: {
      message?: string;
    };
  };
}

const recoverSchema = z.object({
  email: z.string().email('Email inválido').min(1, 'Email es requerido'),
});

type RecoverFormData = z.infer<typeof recoverSchema>;

export const RecoverPasswordPage: React.FC = () => {
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RecoverFormData>({
    resolver: zodResolver(recoverSchema),
  });

  const onSubmit = async (data: RecoverFormData) => {
    try {
      setError(null);
      setSuccess(false);
      await authApi.recoverRequest(data);
      setSuccess(true);
    } catch (err) {
      setError(
        (err as ApiErrorLike).response?.data?.message || 
        'Error al enviar solicitud de recuperación'
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
            <h2 className="text-2xl font-semibold mb-2">Recuperar Contraseña</h2>
            <p className="text-sm text-gray-600">
              Ingresa tu email y te enviaremos un enlace para recuperar tu contraseña
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
            <div className="space-y-6">
              <div className="bg-success-50 border-l-4 border-success-500 p-4 rounded-r-md">
                <div className="flex items-start">
                  <CheckCircle className="text-success-500 mt-0.5 mr-3" size={20} />
                  <div>
                    <p className="text-sm text-success-700 font-medium mb-1">
                      ¡Solicitud enviada exitosamente!
                    </p>
                    <p className="text-sm text-success-600">
                      Revisa tu correo electrónico. Si la dirección existe en nuestro sistema,
                      recibirás un enlace para recuperar tu contraseña.
                    </p>
                  </div>
                </div>
              </div>

              <Link
                to="/login"
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                <ArrowLeft size={20} />
                Volver al Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    id="email"
                    type="email"
                    className="input pl-10"
                    placeholder="usuario@hotel.com"
                    {...register('email')}
                  />
                </div>
                {errors.email && (
                  <p className="text-error-600 text-sm mt-1">{errors.email.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {isSubmitting && <Loader2 className="animate-spin" size={18} />}
                {isSubmitting ? 'Enviando...' : 'Enviar enlace de recuperación'}
              </button>

              <div className="text-center">
                <Link
                  to="/login"
                  className="text-sm text-primary-600 hover:text-primary-700 inline-flex items-center gap-1"
                >
                  <ArrowLeft size={16} />
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
