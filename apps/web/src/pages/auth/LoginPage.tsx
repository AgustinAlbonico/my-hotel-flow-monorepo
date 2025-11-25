/**
 * Login Page - Página de inicio de sesión
 * Siguiendo MEJORES_PRACTICAS.md - Validación con react-hook-form + Zod
 */
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { loginSchema, LoginFormData } from '@/schemas/auth.schema';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { getErrorMessage } from '@/utils/error.utils';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const { success } = useToast();
  const [error, setError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // Redirigir al dashboard cuando el usuario se autentica
  React.useEffect(() => {
    if (isAuthenticated) {
      success('¡Bienvenido!', 'Has iniciado sesión correctamente');
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate, success]);

  const onSubmit = async (data: LoginFormData) => {
    try {
      setError(null);
      await login(data);
      // La navegación se maneja en el useEffect de arriba
    } catch (err) {
      const errorMessage = getErrorMessage(err, 'Error al iniciar sesión. Por favor, intenta nuevamente.');
      setError(errorMessage);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <img src="../../assets/logo.jpg" alt=""  className='w-8 h-8'/>
          <h1 className="text-4xl font-bold text-primary-600 mb-2">
            MyHotelFlow
          </h1>
          <p className="text-gray-600">Sistema de Reservas Hoteleras</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-semibold mb-6">Iniciar Sesión</h2>

          {error && (
            <div className="bg-error-50 border-l-4 border-error-500 p-4 rounded-r-md mb-6">
              <div className="flex items-start">
                <AlertTriangle className="text-error-500 mt-0.5 mr-3" size={20} />
                <p className="text-sm text-error-700">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label htmlFor="identity" className="block text-sm font-medium text-gray-700 mb-1">
                Usuario o Email
              </label>
              <input
                id="identity"
                type="text"
                className="input"
                placeholder="usuario@hotel.com"
                {...register('identity')}
              />
              {errors.identity && (
                <p className="text-error-600 text-sm mt-1">{errors.identity.message}</p>
              )}
            </div>

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
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember"
                  type="checkbox"
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <label htmlFor="remember" className="ml-2 text-sm text-gray-700">
                  Recordarme
                </label>
              </div>

              <Link
                to="/auth/recover"
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {isSubmitting && <Loader2 className="animate-spin" size={18} />}
              {isSubmitting ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
