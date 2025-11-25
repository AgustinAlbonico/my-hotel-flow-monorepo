/**
 * Main Layout - Layout principal con navbar y sidebar
 * Siguiendo FRONTEND_CHECKLIST.md - Layout y Navegación
 */
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Sidebar } from '@/components/layout/Sidebar';
import { LogOut, Settings } from 'lucide-react';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error al cerrar sesión:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navbar */}
      <nav className="bg-white shadow-sm border-b border-gray-200 z-10">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">MH</span>
              </div>
              <span className="text-xl font-bold text-primary-600">MyHotelFlow</span>
            </Link>

            {/* Usuario y logout */}
            <div className="flex items-center gap-4">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-gray-900">
                  {user?.fullName || user?.username}
                </p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  to="/auth/change-password"
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                  title="Configuración"
                >
                  <Settings size={20} />
                </Link>

                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-600 hover:text-error-600 hover:bg-error-50 rounded-md transition-colors"
                  title="Cerrar sesión"
                >
                  <LogOut size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Layout con Sidebar y Main */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </div>
  );
};
