/**
 * Main Layout - Layout principal con navbar y sidebar
 * Siguiendo FRONTEND_CHECKLIST.md - Layout y Navegación
 * Fase 2 - UI/UX: Layout responsive con bottom navigation mobile y Command Palette
 * Fase 3 - UI/UX: Dark Mode toggle
 */
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Sidebar } from '@/components/layout/Sidebar';
import { BottomNavigation } from '@/components/layout/BottomNavigation';
import { CommandPalette } from '@/components/ui/CommandPalette';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { LogOut, Settings, Menu, Search } from 'lucide-react';
import { Tooltip } from '@/components/ui/Tooltip';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error al cerrar sesión:', error);
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Detectar Cmd+K / Ctrl+K para abrir command palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
      } else if (e.key === 'Escape') {
        setIsCommandPaletteOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Navbar */}
      <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 z-10">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Mobile menu button + Logo */}
            <div className="flex items-center gap-3">
              <button
                onClick={toggleMobileMenu}
                className="md:hidden p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                aria-label="Abrir menú"
              >
                <Menu size={24} />
              </button>

              <Link to="/dashboard" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary-600 dark:bg-primary-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">MH</span>
                </div>
                <span className="text-xl font-bold text-primary-600 dark:text-primary-400 hidden sm:inline">
                  MyHotelFlow
                </span>
              </Link>
            </div>

            {/* Search button + Usuario y logout */}
            <div className="flex items-center gap-2 md:gap-4">
              {/* Command Palette Trigger */}
              <Tooltip content="Búsqueda rápida (Cmd+K)" position="bottom">
                <button
                  onClick={() => setIsCommandPaletteOpen(true)}
                  className="hidden md:flex items-center gap-2 px-3 py-1.5 text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
                  aria-label="Abrir búsqueda rápida"
                >
                  <Search size={16} />
                  <span>Buscar...</span>
                  <kbd className="px-1.5 py-0.5 text-xs font-semibold text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded">
                    ⌘K
                  </kbd>
                </button>
              </Tooltip>

              {/* Mobile search button */}
              <button
                onClick={() => setIsCommandPaletteOpen(true)}
                className="md:hidden p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                aria-label="Buscar"
              >
                <Search size={20} />
              </button>

              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {user?.fullName || user?.username}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
              </div>

              <div className="flex items-center gap-2">
                <Tooltip content="Cambiar tema">
                  <ThemeToggle />
                </Tooltip>

                <Tooltip content="Configuración">
                  <Link
                    to="/auth/change-password"
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                    aria-label="Configuración"
                  >
                    <Settings size={20} />
                  </Link>
                </Tooltip>

                <Tooltip content="Cerrar sesión">
                  <button
                    onClick={handleLogout}
                    className="p-2 text-gray-600 hover:text-error-600 hover:bg-error-50 dark:text-gray-300 dark:hover:text-error-400 dark:hover:bg-error-900/20 rounded-md transition-colors"
                    aria-label="Cerrar sesión"
                  >
                    <LogOut size={20} />
                  </button>
                </Tooltip>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Layout con Sidebar y Main */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar isOpen={isMobileMenuOpen} onClose={closeMobileMenu} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-20 md:pb-8">
          {children}
        </main>
      </div>

      {/* Bottom Navigation - Solo mobile */}
      <BottomNavigation onMenuClick={toggleMobileMenu} />

      {/* Command Palette */}
      <CommandPalette 
        isOpen={isCommandPaletteOpen} 
        onClose={() => setIsCommandPaletteOpen(false)} 
      />
    </div>
  );
};
