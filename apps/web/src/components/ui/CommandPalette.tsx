/**
 * CommandPalette - Búsqueda rápida global estilo Cmd+K
 * Fase 2 - UI/UX: Command Palette para navegación rápida
 */
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Calendar, 
  UserCircle, 
  Bed, 
  Users, 
  Shield, 
  Key,
  FileText,
  Sparkles,
  Home,
  Layers,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { Can } from '@/components/auth/Can';

interface CommandItem {
  id: string;
  title: string;
  description?: string;
  icon: React.ElementType;
  action: () => void;
  keywords?: string[];
  permission?: string;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Definir comandos disponibles
  const allCommands: CommandItem[] = useMemo(() => [
    {
      id: 'dashboard',
      title: 'Ir al Dashboard',
      description: 'Página principal',
      icon: Home,
      action: () => {
        navigate('/dashboard');
        onClose();
      },
      keywords: ['inicio', 'home', 'principal'],
    },
    {
      id: 'reservations',
      title: 'Ver Reservas',
      description: 'Gestionar reservas del hotel',
      icon: Calendar,
      action: () => {
        navigate('/reservations');
        onClose();
      },
      keywords: ['reservas', 'reservations', 'bookings'],
      permission: 'reservas.listar',
    },
    {
      id: 'create-reservation',
      title: 'Nueva Reserva',
      description: 'Crear una nueva reserva',
      icon: Calendar,
      action: () => {
        navigate('/reservations/unified?tab=create');
        onClose();
      },
      keywords: ['crear', 'nueva', 'reserva'],
      permission: 'reservas.crear',
    },
    {
      id: 'checkin',
      title: 'Check-In',
      description: 'Registrar llegada de huéspedes',
      icon: Calendar,
      action: () => {
        navigate('/reservations/unified?tab=checkin');
        onClose();
      },
      keywords: ['checkin', 'llegada', 'ingreso'],
      permission: 'reservas.checkin',
    },
    {
      id: 'checkout',
      title: 'Check-Out',
      description: 'Registrar salida de huéspedes',
      icon: Calendar,
      action: () => {
        navigate('/reservations/unified?tab=checkout');
        onClose();
      },
      keywords: ['checkout', 'salida'],
      permission: 'reservas.checkout',
    },
    {
      id: 'clients',
      title: 'Ver Clientes',
      description: 'Gestionar clientes del hotel',
      icon: UserCircle,
      action: () => {
        navigate('/clients');
        onClose();
      },
      keywords: ['clientes', 'clients', 'huéspedes'],
      permission: 'clientes.listar',
    },
    {
      id: 'create-client',
      title: 'Nuevo Cliente',
      description: 'Crear un nuevo cliente',
      icon: UserCircle,
      action: () => {
        navigate('/clients/create');
        onClose();
      },
      keywords: ['crear', 'nuevo', 'cliente'],
      permission: 'clientes.crear',
    },
    {
      id: 'rooms',
      title: 'Ver Habitaciones',
      description: 'Gestionar habitaciones del hotel',
      icon: Bed,
      action: () => {
        navigate('/rooms');
        onClose();
      },
      keywords: ['habitaciones', 'rooms', 'cuartos'],
      permission: 'habitaciones.listar',
    },
    {
      id: 'room-types',
      title: 'Tipos de Habitación',
      description: 'Gestionar tipos de habitación',
      icon: Layers,
      action: () => {
        navigate('/room-types');
        onClose();
      },
      keywords: ['tipos', 'categorías', 'habitaciones'],
      permission: 'habitaciones.listar',
    },
    {
      id: 'features',
      title: 'Características',
      description: 'Gestionar características de habitaciones',
      icon: Sparkles,
      action: () => {
        navigate('/caracteristicas');
        onClose();
      },
      keywords: ['características', 'features', 'amenities'],
      permission: 'habitaciones.listar',
    },
    {
      id: 'invoices',
      title: 'Ver Facturas',
      description: 'Gestionar facturas',
      icon: FileText,
      action: () => {
        navigate('/invoices');
        onClose();
      },
      keywords: ['facturas', 'invoices', 'comprobantes'],
      permission: 'facturas.ver',
    },
    {
      id: 'users',
      title: 'Ver Usuarios',
      description: 'Gestionar usuarios del sistema',
      icon: Users,
      action: () => {
        navigate('/users');
        onClose();
      },
      keywords: ['usuarios', 'users', 'equipo'],
      permission: 'config.usuarios.listar',
    },
    {
      id: 'groups',
      title: 'Ver Grupos',
      description: 'Gestionar grupos y permisos',
      icon: Shield,
      action: () => {
        navigate('/groups');
        onClose();
      },
      keywords: ['grupos', 'groups', 'permisos'],
      permission: 'config.grupos.listar',
    },
    {
      id: 'actions',
      title: 'Ver Acciones',
      description: 'Gestionar acciones del sistema',
      icon: Key,
      action: () => {
        navigate('/actions');
        onClose();
      },
      keywords: ['acciones', 'actions', 'permisos'],
      permission: 'config.acciones.listar',
    },
  ], [navigate, onClose]);

  // Filtrar comandos basado en la búsqueda
  const filteredCommands = useMemo(() => {
    if (!searchQuery.trim()) {
      return allCommands.slice(0, 10); // Mostrar primeros 10 si no hay búsqueda
    }

    const query = searchQuery.toLowerCase();
    return allCommands.filter((cmd) => {
      const titleMatch = cmd.title.toLowerCase().includes(query);
      const descriptionMatch = cmd.description?.toLowerCase().includes(query);
      const keywordsMatch = cmd.keywords?.some(k => k.toLowerCase().includes(query));
      return titleMatch || descriptionMatch || keywordsMatch;
    });
  }, [searchQuery, allCommands]);

  // Resetear índice seleccionado cuando cambian los resultados
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  // Focus en el input cuando se abre
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Manejar navegación con teclado
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => 
          prev < filteredCommands.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex]);

  // Scroll al elemento seleccionado
  useEffect(() => {
    if (listRef.current) {
      const selectedElement = listRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return createPortal(
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50 animate-in fade-in-0 duration-200"
        onClick={onClose}
      />

      {/* Command Palette */}
      <div className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-2xl z-50 animate-in fade-in-0 zoom-in-95 duration-200 px-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl overflow-hidden">
          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <Search className="text-gray-400 dark:text-gray-500 flex-shrink-0" size={20} />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar acciones, páginas..."
              className="flex-1 bg-transparent outline-none text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
            />
            <kbd className="hidden sm:inline-block px-2 py-1 text-xs font-semibold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div 
            ref={listRef}
            className="max-h-[400px] overflow-y-auto py-2"
          >
            {filteredCommands.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                No se encontraron resultados
              </div>
            ) : (
              filteredCommands.map((cmd, index) => {
                const Icon = cmd.icon;
                
                // Si tiene permiso, envolver en Can
                const commandButton = (
                  <button
                    key={cmd.id}
                    onClick={cmd.action}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
                      'hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600',
                      selectedIndex === index && 'bg-primary-50 dark:bg-primary-900/40'
                    )}
                  >
                    <div className={cn(
                      'w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0',
                      selectedIndex === index ? 'bg-primary-100 dark:bg-primary-800/50' : 'bg-gray-100 dark:bg-gray-700'
                    )}>
                      <Icon 
                        size={18} 
                        className={selectedIndex === index ? 'text-primary-600 dark:text-primary-400' : 'text-gray-600 dark:text-gray-400'} 
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{cmd.title}</p>
                      {cmd.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{cmd.description}</p>
                      )}
                    </div>
                  </button>
                );

                if (cmd.permission) {
                  return (
                    <Can key={cmd.id} perform={cmd.permission}>
                      {commandButton}
                    </Can>
                  );
                }

                return commandButton;
              })
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs text-gray-500 dark:text-gray-400">
            <span>Navega con ↑↓</span>
            <span>Selecciona con Enter</span>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
};
