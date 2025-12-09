/**
 * Sidebar - Navegación lateral con secciones agrupadas
 * Siguiendo FRONTEND_CHECKLIST.md - Layout y Navegación
 * Fase 2 - UI/UX: Sidebar responsive con drawer en mobile
 */
import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Can } from '@/components/auth/Can';
import {
  Home,
  Users,
  Shield,
  Key,
  Calendar,
  Building2,
  FileText,
  ChevronLeft,
  ChevronRight,
  UserCircle,
  Layers,
  Sparkles,
  X,
  ClipboardList,
} from 'lucide-react';
import { cn } from '@/utils/cn';

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
  permission?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: 'General',
    items: [
      {
        label: 'Dashboard',
        path: '/dashboard',
        icon: Home,
      },
    ],
  },
  {
    title: 'Configuración',
    items: [
      {
        label: 'Usuarios',
        path: '/users',
        icon: Users,
        permission: 'config.usuarios.listar',
      },
      {
        label: 'Grupos',
        path: '/groups',
        icon: Shield,
        permission: 'config.grupos.listar',
      },
      {
        label: 'Acciones',
        path: '/actions',
        icon: Key,
        permission: 'config.acciones.listar',
      },
    ],
  },
  {
    title: 'Operación',
    items: [
      {
        label: 'Reservas',
        path: '/reservations',
        icon: Calendar,
        permission: 'reservas.listar',
      },
      {
        label: 'Clientes',
        path: '/clients',
        icon: UserCircle,
        permission: 'clientes.listar',
      },
      {
        label: 'Habitaciones',
        path: '/rooms',
        icon: Building2,
        permission: 'habitaciones.listar',
      },
      {
        label: 'Tipos de Habitación',
        path: '/room-types',
        icon: Layers,
        permission: 'habitaciones.listar',
      },
      {
        label: 'Características',
        path: '/caracteristicas',
        icon: Sparkles,
        permission: 'habitaciones.listar',
      },
      {
        label: 'Facturas',
        path: '/invoices',
        icon: FileText,
        permission: 'facturas.ver',
      },
    ],
  },
  {
    title: 'Seguridad',
    items: [
      {
        label: 'Auditoría',
        path: '/audit',
        icon: ClipboardList,
        permission: 'auditoria.ver',
      },
    ],
  },
];

interface SidebarProps {
  className?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ className, isOpen = true, onClose }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detectar si estamos en mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Cerrar sidebar al hacer clic en un link en mobile
  const handleLinkClick = () => {
    if (isMobile && onClose) {
      onClose();
    }
  };

  // Prevenir scroll del body cuando el drawer está abierto en mobile
  useEffect(() => {
    if (isMobile && isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobile, isOpen]);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const navLinkClasses = (isActive: boolean) =>
    cn(
      'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
      'active:bg-gray-200 dark:active:bg-gray-800',
      isActive
        ? 'bg-primary-50 dark:bg-primary-900/40 text-primary-700 dark:text-primary-100'
        : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
    );

  const desktopNavLinkClasses = (isActive: boolean, collapsed: boolean) =>
    cn(
      'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
      isActive
        ? 'bg-primary-50 dark:bg-primary-900/40 text-primary-700 dark:text-primary-100'
        : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white',
      collapsed && 'justify-center'
    );

  // En mobile, renderizar como drawer con overlay
  if (isMobile) {
    return (
      <>
        {/* Overlay */}
        {isOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={onClose}
            aria-hidden="true"
          />
        )}

        {/* Drawer */}
        <aside
          className={cn(
            'fixed top-0 left-0 bottom-0 bg-white dark:bg-gray-900 z-50 md:hidden',
            'w-64 transform transition-transform duration-300 ease-in-out',
            'flex flex-col shadow-xl border-r border-gray-200 dark:border-gray-800',
            isOpen ? 'translate-x-0' : '-translate-x-full',
            className
          )}
        >
          {/* Header con botón cerrar */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Menú</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
              aria-label="Cerrar menú"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation sections */}
          <nav className="flex-1 overflow-y-auto py-4">
            {navSections.map((section) => (
              <div key={section.title} className="mb-6">
                <h3 className="px-3 mb-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {section.title}
                </h3>
                <div className="space-y-1 px-2">
                  {section.items.map((item) => {
                    const Icon = item.icon;

                    if (item.permission) {
                      return (
                        <Can key={item.path} perform={item.permission}>
                          <NavLink
                            to={item.path}
                            onClick={handleLinkClick}
                            className={({ isActive }) => navLinkClasses(isActive)}
                          >
                            <Icon size={20} className="flex-shrink-0" />
                            <span>{item.label}</span>
                          </NavLink>
                        </Can>
                      );
                    }

                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={handleLinkClick}
                        className={({ isActive }) => navLinkClasses(isActive)}
                      >
                        <Icon size={20} className="flex-shrink-0" />
                        <span>{item.label}</span>
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </aside>
      </>
    );
  }

  // Desktop sidebar
  return (
    <aside
      className={cn(
        'bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 flex flex-col',
        'hidden md:flex',
        isCollapsed ? 'w-16' : 'w-64',
        className
      )}
    >
      {/* Toggle button */}
      <div className="h-16 flex items-center justify-end px-4 border-b border-gray-200 dark:border-gray-800">
        <button
          onClick={toggleSidebar}
          className="p-1.5 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
          aria-label={isCollapsed ? 'Expandir sidebar' : 'Contraer sidebar'}
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      {/* Navigation sections */}
      <nav className="flex-1 overflow-y-auto py-4">
        {navSections.map((section) => (
          <div key={section.title} className="mb-6">
            {!isCollapsed && (
              <h3 className="px-4 mb-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {section.title}
              </h3>
            )}
            <div className="space-y-1 px-2">
              {section.items.map((item) => {
                const Icon = item.icon;

                if (item.permission) {
                  return (
                    <Can key={item.path} perform={item.permission}>
                      <NavLink
                        to={item.path}
                        className={({ isActive }) => desktopNavLinkClasses(isActive, isCollapsed)}
                        title={isCollapsed ? item.label : undefined}
                      >
                        <Icon size={20} className="flex-shrink-0" />
                        {!isCollapsed && <span>{item.label}</span>}
                      </NavLink>
                    </Can>
                  );
                }

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) => desktopNavLinkClasses(isActive, isCollapsed)}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <Icon size={20} className="flex-shrink-0" />
                    {!isCollapsed && <span>{item.label}</span>}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
};
