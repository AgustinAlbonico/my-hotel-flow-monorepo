/**
 * Dashboard Page - Página principal del sistema
 * Siguiendo MEJORES_PRACTICAS.md - Estructura de componentes
 */
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Can } from '@/components/auth/Can';
import { Key, Users, Shield, Calendar, UserCircle, Bed, Sparkles } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          ¡Bienvenido, {user?.fullName || user?.username}!
        </h2>
        <p className="text-gray-600">
          Panel de control principal de MyHotelFlow
        </p>
      </div>

      {/* Cards de acciones rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Can perform="reservas.listar">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Reservas</h3>
              <Calendar className="text-primary-600" size={24} />
            </div>
            <p className="text-gray-600 mb-4">
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
            <p className="text-gray-600 mb-4">
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
            <p className="text-gray-600 mb-4">
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
            <p className="text-gray-600 mb-4">
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
          <p className="text-gray-600 mb-4">
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
            <p className="text-gray-600 mb-4">
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
            <p className="text-gray-600 mb-4">
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
            <p className="text-gray-600 mb-4">
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

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Usuario Activo</h3>
            <span className={`badge ${user?.isActive ? 'badge-success' : 'badge-error'}`}>
              {user?.isActive ? 'Activo' : 'Inactivo'}
            </span>
          </div>
          <div className="space-y-2 text-sm text-gray-600">
            <p><strong>Usuario:</strong> {user?.username}</p>
            <p><strong>Email:</strong> {user?.email}</p>
            <p><strong>Último acceso:</strong> {user?.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'N/A'}</p>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">Sistema</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <p><strong>Versión:</strong> 1.0.0</p>
            <p><strong>Entorno:</strong> Desarrollo</p>
            <p><strong>Estado:</strong> <span className="text-success-600 font-medium">Operativo</span></p>
          </div>
        </div>
      </div>
    </div>
  );
};
