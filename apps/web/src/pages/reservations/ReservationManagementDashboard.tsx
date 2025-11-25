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
      navigate(option.path);
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
      <nav className="mb-6 text-sm text-gray-600">
        <button onClick={() => navigate('/')} className="hover:text-primary-600">
          Inicio
        </button>
        <ChevronRight className="inline mx-2" size={16} />
        <span className="text-gray-900 font-medium">Gestión de Reservas</span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Gestión de Reservas
        </h1>
        <p className="text-gray-600">
          Selecciona una opción para gestionar las reservas del hotel
        </p>
      </div>

      {/* Stats */}
      {menuData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Opciones Disponibles</p>
                <p className="text-3xl font-bold text-primary-600 mt-1">
                  {menuData.availableOptions}
                </p>
              </div>
              <Calendar className="text-primary-600" size={40} />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de Opciones</p>
                <p className="text-3xl font-bold text-gray-700 mt-1">
                  {menuData.totalOptions}
                </p>
              </div>
              <BarChart3 className="text-gray-600" size={40} />
            </div>
          </div>
        </div>
      )}

      {/* Opciones del Menú */}
      {availableOptions.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <AlertTriangle className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Sin permisos
          </h3>
          <p className="text-gray-600">
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
                      ? 'bg-white border-gray-200 hover:border-primary-500 hover:shadow-md cursor-pointer'
                      : 'bg-gray-50 border-gray-200 cursor-not-allowed opacity-50'
                  }
                `}
              >
                <div className="flex items-start justify-between mb-4">
                  <div
                    className={`p-3 rounded-lg ${
                      isAvailable
                        ? 'bg-primary-100 text-primary-600'
                        : 'bg-gray-200 text-gray-400'
                    }`}
                  >
                    <Icon size={28} />
                  </div>
                  {isAvailable && (
                    <ChevronRight className="text-gray-400" size={20} />
                  )}
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {option.label}
                </h3>
                <p className="text-sm text-gray-600 mb-3">{option.description}</p>

                {!isAvailable && (
                  <span className="inline-block px-2 py-1 bg-gray-200 text-gray-600 text-xs rounded">
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
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-700">
            ℹ️ <strong>Tip:</strong> Las opciones mostradas dependen de tus permisos.
            Si necesitas acceso a más funciones, contacta al administrador.
          </p>
        </div>
      )}
    </div>
  );
};
