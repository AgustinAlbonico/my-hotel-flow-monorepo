/**
 * Sidebar - Navegación lateral con secciones agrupadas
 * Siguiendo FRONTEND_CHECKLIST.md - Layout y Navegación
 */
import React, { useState } from 'react';
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
    title: 'Operaciones',
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
];

interface SidebarProps {
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ className }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <aside
      className={cn(
        'bg-white border-r border-gray-200 transition-all duration-300 flex flex-col',
        isCollapsed ? 'w-16' : 'w-64',
        className
      )}
    >
      {/* Toggle button */}
      <div className="h-16 flex items-center justify-end px-4 border-b border-gray-200">
        <button
          onClick={toggleSidebar}
          className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
          title={isCollapsed ? 'Expandir sidebar' : 'Contraer sidebar'}
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      {/* Navigation sections */}
      <nav className="flex-1 overflow-y-auto py-4">
        {navSections.map((section) => (
          <div key={section.title} className="mb-6">
            {!isCollapsed && (
              <h3 className="px-4 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {section.title}
              </h3>
            )}
            <div className="space-y-1 px-2">
              {section.items.map((item) => {
                const Icon = item.icon;

                // Si requiere permiso, envolver en Can
                if (item.permission) {
                  return (
                    <Can key={item.path} perform={item.permission}>
                      <NavLink
                        to={item.path}
                        className={({ isActive }) =>
                          cn(
                            'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                            isActive
                              ? 'bg-primary-50 text-primary-700'
                              : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900',
                            isCollapsed && 'justify-center'
                          )
                        }
                        title={isCollapsed ? item.label : undefined}
                      >
                        <Icon size={20} className="flex-shrink-0" />
                        {!isCollapsed && <span>{item.label}</span>}
                      </NavLink>
                    </Can>
                  );
                }

                // Sin permiso, renderizar directamente
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900',
                        isCollapsed && 'justify-center'
                      )
                    }
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
