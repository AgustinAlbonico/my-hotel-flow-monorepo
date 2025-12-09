/**
 * Reservation Management Dashboard
 * Siguiendo MEJORES_PRACTICAS.md y DESIGN_SYSTEM.md
 * CUD01 - Gestionar Reservas
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Calendar,
  CalendarX,
  Edit3,
  Search,
  BarChart3,
  Loader2,
  AlertTriangle,
  ChevronRight,
  CalendarCheck,
  CalendarPlus,
} from 'lucide-react';
import { reservationsApi } from '@/api/reservations.api';
import type { ReservationMenuOption } from '@/api/reservations.api';

// Mapeo de iconos
const iconMap = {
  'calendar-plus': CalendarPlus,
  'calendar-check': CalendarCheck,
  'calendar-x': CalendarX,
  'calendar-edit': Edit3,
  search: Search,
  'chart-bar': BarChart3,
};

export const ReservationManagementDashboard: React.FC = () => {
  const navigate = useNavigate();

  const {
    data: menuData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['reservation-menu'],
    queryFn: reservationsApi.getReservationMenu,
  });

  const handleOptionClick = (option: ReservationMenuOption): void => {
    if (option.isAvailable) {
      // Mapeo de rutas antiguas a la nueva página unificada con tabs
      const tabMapping: Record<string, string> = {
        '/reservations/create': '/reservations/unified?tab=create',
        '/reservations/checkin': '/reservations/unified?tab=checkin',
        '/reservations/checkout': '/reservations/unified?tab=checkout',
        '/reservations/manage': '/reservations/unified?tab=list',
        '/reservations/cancel': '/reservations/unified?tab=list',
        '/reservations/modify': '/reservations/unified?tab=list',
      };

      // Si la ruta está en el mapeo, usar la nueva ruta unificada
      const targetPath = tabMapping[option.path] || option.path;
      navigate(targetPath);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-primary-600" size={48} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-error-50 border-l-4 border-error-500 p-4 rounded-r-md">
          <div className="flex items-start">
            <AlertTriangle className="text-error-500 mt-0.5 mr-3" size={20} />
            <div>
              <h3 className="text-sm font-medium text-error-800">
                Error al cargar el menú
              </h3>
              <p className="text-sm text-error-700 mt-1">
                {error instanceof Error ? error.message : 'Error desconocido'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const availableOptions = menuData?.options.filter((opt) => opt.isAvailable) || [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-gray-600 dark:text-gray-400">
        <button onClick={() => navigate('/')} className="hover:text-primary-600 dark:hover:text-primary-400">
          Inicio
        </button>
        <ChevronRight className="inline mx-2" size={16} />
        <span className="text-gray-900 dark:text-gray-100 font-medium">Gestión de Reservas</span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Gestión de Reservas
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Selecciona una opción para gestionar las reservas del hotel
            </p>
          </div>
          <button
            onClick={() => navigate('/reservations/unified')}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
          >
            <Calendar size={20} />
            Ir a Vista Unificada
          </button>
        </div>
      </div>

      {/* Stats */}
      {menuData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Opciones Disponibles</p>
                <p className="text-3xl font-bold text-primary-600 dark:text-primary-400 mt-1">
                  {menuData.availableOptions}
                </p>
              </div>
              <Calendar className="text-primary-600 dark:text-primary-400" size={40} />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total de Opciones</p>
                <p className="text-3xl font-bold text-gray-700 dark:text-gray-300 mt-1">
                  {menuData.totalOptions}
                </p>
              </div>
              <BarChart3 className="text-gray-600 dark:text-gray-400" size={40} />
            </div>
          </div>
        </div>
      )}

      {/* Opciones del Menú */}
      {availableOptions.length === 0 ? (
        <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
          <AlertTriangle className="mx-auto text-gray-400 dark:text-gray-500 mb-4" size={48} />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Sin permisos
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            No tienes permisos para acceder a ninguna opción de gestión de reservas.
            Contacta al administrador del sistema.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuData?.options.map((option) => {
            const Icon = iconMap[option.icon as keyof typeof iconMap] || Calendar;
            const isAvailable = option.isAvailable;

            return (
              <button
                key={option.key}
                onClick={() => handleOptionClick(option)}
                disabled={!isAvailable}
                className={`
                  text-left p-6 rounded-lg border-2 transition-all
                  ${
                    isAvailable
                      ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-400 hover:shadow-md cursor-pointer'
                      : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 cursor-not-allowed opacity-50'
                  }
                `}
              >
                <div className="flex items-start justify-between mb-4">
                  <div
                    className={`p-3 rounded-lg ${
                      isAvailable
                        ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
                    }`}
                  >
                    <Icon size={28} />
                  </div>
                  {isAvailable && (
                    <ChevronRight className="text-gray-400 dark:text-gray-500" size={20} />
                  )}
                </div>

                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {option.label}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{option.description}</p>

                {!isAvailable && (
                  <span className="inline-block px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded">
                    Sin permiso
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Info adicional */}
      {availableOptions.length > 0 && (
        <div className="mt-8 space-y-4">
          <div className="bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-5">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-primary-600 dark:bg-primary-500 rounded-full flex items-center justify-center">
                <Calendar className="text-white" size={20} />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-primary-900 dark:text-primary-100 mb-1">
                  ✨ Nueva Vista Unificada Disponible
                </h3>
                <p className="text-sm text-primary-700 dark:text-primary-300 mb-3">
                  Accede a todas las operaciones de reservas desde una interfaz moderna con tabs. 
                  Gestiona check-in, check-out, creación y modificación de reservas desde un solo lugar.
                </p>
                <button
                  onClick={() => navigate('/reservations/unified')}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 dark:bg-primary-500 text-white text-sm font-medium rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors"
                >
                  <Calendar size={16} />
                  Ir a Vista Unificada
                </button>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              ℹ️ <strong>Tip:</strong> Las opciones mostradas dependen de tus permisos.
              Si necesitas acceso a más funciones, contacta al administrador.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
