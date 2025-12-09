/**
 * Dashboard Page - Página principal del sistema
 * Siguiendo MEJORES_PRACTICAS.md - Estructura de componentes
 * Fase 2 - UI/UX: Dashboard con shortcuts rápidos
 * Fase 3 - UI/UX: Estadísticas y gráficos con Recharts
 */
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Can } from '@/components/auth/Can';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { 
  Key, 
  Users, 
  Shield, 
  Calendar, 
  UserCircle, 
  Bed, 
  Sparkles,
  Plus,
  LogIn,
  LogOut,
  Search,
  ClipboardList,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          ¡Bienvenido, {user?.fullName || user?.username}!
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Panel de control principal de MyHotelFlow
        </p>
      </div>

      {/* Estadísticas y Gráficos - Fase 3 */}
      <DashboardStats />

      {/* Acciones Rápidas */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Acciones Rápidas</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <Can perform="reservas.crear">
            <button
              onClick={() => navigate('/reservations/unified?tab=create')}
              className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg border-2 border-primary-200 dark:border-primary-500/50 hover:border-primary-400 dark:hover:border-primary-400 hover:shadow-md active:shadow-lg transition-all min-h-[80px] touch-manipulation"
            >
              <div className="flex-shrink-0 w-10 h-10 bg-primary-100 dark:bg-primary-900/40 rounded-lg flex items-center justify-center">
                <Plus className="text-primary-600 dark:text-primary-300" size={20} />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">Nueva Reserva</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Crear rápida</p>
              </div>
            </button>
          </Can>

          <Can perform="reservas.checkin">
            <button
              onClick={() => navigate('/reservations/unified?tab=checkin')}
              className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg border-2 border-success-200 dark:border-success-500/50 hover:border-success-400 dark:hover:border-success-400 hover:shadow-md active:shadow-lg transition-all min-h-[80px] touch-manipulation"
            >
              <div className="flex-shrink-0 w-10 h-10 bg-success-100 dark:bg-success-900/30 rounded-lg flex items-center justify-center">
                <LogIn className="text-success-600 dark:text-success-300" size={20} />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">Check-In</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Registrar llegada</p>
              </div>
            </button>
          </Can>

          <Can perform="reservas.checkout">
            <button
              onClick={() => navigate('/reservations/unified?tab=checkout')}
              className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg border-2 border-warning-200 dark:border-warning-500/50 hover:border-warning-400 dark:hover:border-warning-400 hover:shadow-md active:shadow-lg transition-all min-h-[80px] touch-manipulation"
            >
              <div className="flex-shrink-0 w-10 h-10 bg-warning-100 dark:bg-warning-900/30 rounded-lg flex items-center justify-center">
                <LogOut className="text-warning-600 dark:text-warning-300" size={20} />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">Check-Out</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Salida de huéspedes</p>
              </div>
            </button>
          </Can>

          <Can perform="clientes.crear">
            <button
              onClick={() => navigate('/clients/create')}
              className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg border-2 border-blue-200 dark:border-blue-500/50 hover:border-blue-400 dark:hover:border-blue-400 hover:shadow-md active:shadow-lg transition-all min-h-[80px] touch-manipulation"
            >
              <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <UserCircle className="text-blue-600 dark:text-blue-300" size={20} />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">Nuevo Cliente</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Agregar cliente</p>
              </div>
            </button>
          </Can>

          <Can perform="reservas.listar">
            <button
              onClick={() => navigate('/reservations')}
              className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-500 hover:shadow-md active:shadow-lg transition-all min-h-[80px] touch-manipulation"
            >
              <div className="flex-shrink-0 w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                <Search className="text-gray-600 dark:text-gray-300" size={20} />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">Ver Reservas</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Buscar y filtrar</p>
              </div>
            </button>
          </Can>

          <Can perform="habitaciones.listar">
            <button
              onClick={() => navigate('/rooms')}
              className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-500 hover:shadow-md active:shadow-lg transition-all min-h-[80px] touch-manipulation"
            >
              <div className="flex-shrink-0 w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                <Bed className="text-gray-600 dark:text-gray-300" size={20} />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">Habitaciones</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Ver disponibilidad</p>
              </div>
            </button>
          </Can>
        </div>
      </div>

      {/* Cards de acciones rápidas */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Módulos del Sistema</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Can perform="reservas.listar">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Reservas</h3>
              <Calendar className="text-primary-600" size={24} />
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Gestiona las reservas del hotel
            </p>
            <button
              onClick={() => navigate('/reservations')}
              className="btn-secondary w-full"
            >
              Gestionar Reservas
            </button>
          </div>
        </Can>

        <Can perform="clientes.listar">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Clientes</h3>
              <UserCircle className="text-primary-600" size={24} />
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Gestiona los perfiles de clientes del hotel
            </p>
            <button
              onClick={() => navigate('/clients')}
              className="btn-secondary w-full"
            >
              Gestionar Clientes
            </button>
          </div>
        </Can>

        <Can perform="habitaciones.listar">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Habitaciones</h3>
              <Bed className="text-primary-600" size={24} />
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Gestiona las habitaciones del hotel
            </p>
            <button
              onClick={() => navigate('/rooms')}
              className="btn-secondary w-full"
            >
              Gestionar Habitaciones
            </button>
          </div>
        </Can>

        <Can perform="habitaciones.listar">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Características</h3>
              <Sparkles className="text-primary-600" size={24} />
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Gestiona las características de las habitaciones
            </p>
            <button
              onClick={() => navigate('/caracteristicas')}
              className="btn-secondary w-full"
            >
              Gestionar Características
            </button>
          </div>
        </Can>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Perfil</h3>
            <Key className="text-primary-600" size={24} />
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Gestiona tu información personal y cambia tu contraseña
          </p>
          <button
            onClick={() => navigate('/auth/change-password')}
            className="btn-secondary w-full"
          >
            Cambiar Contraseña
          </button>
        </div>

        <Can perform="config.usuarios.listar">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Usuarios</h3>
              <Users className="text-primary-600" size={24} />
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Gestiona usuarios del sistema y sus permisos
            </p>
            <button
              onClick={() => navigate('/users')}
              className="btn-secondary w-full"
            >
              Ver Usuarios
            </button>
          </div>
        </Can>

        <Can perform="config.grupos.listar">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Grupos</h3>
              <Shield className="text-primary-600" size={24} />
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Gestiona grupos y permisos del sistema
            </p>
            <button
              onClick={() => navigate('/groups')}
              className="btn-secondary w-full"
            >
              Ver Grupos
            </button>
          </div>
        </Can>

        <Can perform="config.acciones.listar">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Acciones</h3>
              <Key className="text-primary-600" size={24} />
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Gestiona las acciones y permisos disponibles
            </p>
            <button
              onClick={() => navigate('/actions')}
              className="btn-secondary w-full"
            >
              Ver Acciones
            </button>
          </div>
        </Can>

        <Can perform="auditoria.ver">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Auditoría</h3>
              <ClipboardList className="text-primary-600" size={24} />
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Historial de cambios, sesiones y actividad del sistema
            </p>
            <button
              onClick={() => navigate('/audit')}
              className="btn-secondary w-full"
            >
              Ver Auditoría
            </button>
          </div>
        </Can>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Usuario Activo</h3>
            <span className={`badge ${user?.isActive ? 'badge-success' : 'badge-error'}`}>
              {user?.isActive ? 'Activo' : 'Inactivo'}
            </span>
          </div>
          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <p><strong>Usuario:</strong> {user?.username}</p>
            <p><strong>Email:</strong> {user?.email}</p>
            <p><strong>Último acceso:</strong> {user?.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'N/A'}</p>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">Sistema</h3>
          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <p><strong>Versión:</strong> 1.0.0</p>
            <p><strong>Entorno:</strong> Desarrollo</p>
            <p><strong>Estado:</strong> <span className="text-success-600 font-medium">Operativo</span></p>
          </div>
        </div>
      </div>
    </div>
  );
};
