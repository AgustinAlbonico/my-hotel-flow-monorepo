/**
 * BottomNavigation - Barra de navegación inferior para mobile
 * Fase 2 - Mejoras UI/UX: Navegación móvil optimizada
 */
import React from 'react';
import { NavLink } from 'react-router-dom';
import { Can } from '@/components/auth/Can';
import {
  Home,
  Calendar,
  UserCircle,
  Building2,
  Menu,
} from 'lucide-react';
import { cn } from '@/utils/cn';

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
  permission?: string;
}

const bottomNavItems: NavItem[] = [
  {
    label: 'Inicio',
    path: '/dashboard',
    icon: Home,
  },
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
];

interface BottomNavigationProps {
  onMenuClick?: () => void;
  className?: string;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  onMenuClick,
  className,
}) => {
  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg',
        'md:hidden z-50',
        className
      )}
      role="navigation"
      aria-label="Navegación principal"
    >
      <div className="flex items-center justify-around h-16 px-2">
        {/* Navigation items - Mínimo 44x44px touch target */}
        {bottomNavItems.map((item) => {
          const Icon = item.icon;

          if (item.permission) {
            return (
              <Can key={item.path} perform={item.permission}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    cn(
                      'flex flex-col items-center justify-center gap-1 px-3 py-2',
                      'min-w-[60px] min-h-[56px] transition-colors rounded-lg',
                      'active:bg-gray-100 touch-manipulation',
                      isActive
                        ? 'text-primary-600'
                        : 'text-gray-600 hover:text-gray-900'
                    )
                  }
                  aria-label={item.label}
                >
                  <Icon size={24} className="flex-shrink-0" aria-hidden="true" />
                  <span className="text-xs font-medium">{item.label}</span>
                </NavLink>
              </Can>
            );
          }

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center justify-center gap-1 px-3 py-2',
                  'min-w-[60px] min-h-[56px] transition-colors rounded-lg',
                  'active:bg-gray-100 touch-manipulation',
                  isActive
                    ? 'text-primary-600'
                    : 'text-gray-600 hover:text-gray-900'
                )
              }
              aria-label={item.label}
            >
              <Icon size={24} className="flex-shrink-0" aria-hidden="true" />
              <span className="text-xs font-medium">{item.label}</span>
            </NavLink>
          );
        })}

        {/* Menu button - Mínimo 44x44px touch target */}
        <button
          onClick={onMenuClick}
          className={cn(
            'flex flex-col items-center justify-center gap-1 px-3 py-2',
            'min-w-[60px] min-h-[56px] rounded-lg touch-manipulation',
            'text-gray-600 hover:text-gray-900 active:bg-gray-100 transition-colors'
          )}
          aria-label="Menú"
          aria-expanded="false"
        >
          <Menu size={24} aria-hidden="true" />
          <span className="text-xs font-medium">Menú</span>
        </button>
      </div>
    </nav>
  );
};
