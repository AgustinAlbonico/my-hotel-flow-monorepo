/**
 * Forbidden Page (403) - Página de acceso denegado
 * Siguiendo MEJORES_PRACTICAS.md - UX para errores
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Home, ArrowLeft } from 'lucide-react';

export const ForbiddenPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8 flex justify-center">
          <div className="w-24 h-24 bg-error-100 rounded-full flex items-center justify-center">
            <ShieldAlert className="text-error-600" size={48} />
          </div>
        </div>

        <h1 className="text-6xl font-bold text-gray-300 mb-4">403</h1>
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          Acceso Denegado
        </h2>
        <p className="text-gray-600 mb-8">
          No tienes permisos suficientes para acceder a esta página.
          Si crees que esto es un error, contacta con el administrador del sistema.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="btn-secondary inline-flex items-center justify-center gap-2"
          >
            <ArrowLeft size={20} />
            Volver Atrás
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="btn-primary inline-flex items-center justify-center gap-2"
          >
            <Home size={20} />
            Ir al Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};
