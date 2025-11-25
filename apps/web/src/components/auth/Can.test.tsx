/**
 * Tests para componente Can
 * Siguiendo MEJORES_PRACTICAS.md - Testing
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { Can } from './Can';
import { PermissionsProvider } from '@/contexts/PermissionsContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as permissionsApi from '@/api/permissions.api';
import * as storage from '@/utils/storage';

vi.mock('@/api/permissions.api');
vi.mock('@/utils/storage');

const createWrapper = (permissions: string[]) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  vi.mocked(storage.getToken).mockReturnValue('token');
  vi.mocked(permissionsApi.permissionsApi.getPermissions).mockResolvedValue(
    permissions
  );

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <PermissionsProvider>{children}</PermissionsProvider>
    </QueryClientProvider>
  );
};

describe('Can Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Con permiso único', () => {
    it('debe renderizar children si el usuario tiene el permiso', async () => {
      render(
        <Can perform="config.usuarios.listar">
          <button>Ver Usuarios</button>
        </Can>,
        { wrapper: createWrapper(['config.usuarios.listar']) }
      );

      await waitFor(() => {
        expect(screen.getByText('Ver Usuarios')).toBeInTheDocument();
      });
    });

    it('no debe renderizar children si el usuario NO tiene el permiso', () => {
      render(
        <Can perform="config.usuarios.eliminar">
          <button>Eliminar Usuario</button>
        </Can>,
        { wrapper: createWrapper(['config.usuarios.listar']) }
      );

      expect(screen.queryByText('Eliminar Usuario')).not.toBeInTheDocument();
    });
  });

  describe('Con múltiples permisos (AND)', () => {
    it('debe renderizar si tiene TODOS los permisos', async () => {
      render(
        <Can perform={['config.usuarios.listar', 'config.usuarios.crear']}>
          <button>Gestionar Usuarios</button>
        </Can>,
        {
          wrapper: createWrapper([
            'config.usuarios.listar',
            'config.usuarios.crear',
          ]),
        }
      );

      await waitFor(() => {
        expect(screen.getByText('Gestionar Usuarios')).toBeInTheDocument();
      });
    });

    it('no debe renderizar si falta algún permiso', () => {
      render(
        <Can perform={['config.usuarios.listar', 'config.usuarios.eliminar']}>
          <button>Gestionar Usuarios</button>
        </Can>,
        { wrapper: createWrapper(['config.usuarios.listar']) }
      );

      expect(screen.queryByText('Gestionar Usuarios')).not.toBeInTheDocument();
    });
  });

  describe('Con modo OR (requireAll=false)', () => {
    it('debe renderizar si tiene AL MENOS UNO de los permisos', async () => {
      render(
        <Can
          perform={['config.usuarios.crear', 'config.usuarios.eliminar']}
          requireAll={false}
        >
          <button>Modificar Usuario</button>
        </Can>,
        { wrapper: createWrapper(['config.usuarios.crear']) }
      );

      await waitFor(() => {
        expect(screen.getByText('Modificar Usuario')).toBeInTheDocument();
      });
    });

    it('no debe renderizar si NO tiene ninguno de los permisos', () => {
      render(
        <Can
          perform={['config.usuarios.crear', 'config.usuarios.eliminar']}
          requireAll={false}
        >
          <button>Modificar Usuario</button>
        </Can>,
        { wrapper: createWrapper(['config.usuarios.listar']) }
      );

      expect(screen.queryByText('Modificar Usuario')).not.toBeInTheDocument();
    });
  });

  describe('Con fallback', () => {
    it('debe mostrar fallback si no tiene permisos', async () => {
      render(
        <Can
          perform="config.usuarios.eliminar"
          fallback={<p>Sin permisos</p>}
        >
          <button>Eliminar</button>
        </Can>,
        { wrapper: createWrapper(['config.usuarios.listar']) }
      );

      await waitFor(() => {
        expect(screen.getByText('Sin permisos')).toBeInTheDocument();
      });
      expect(screen.queryByText('Eliminar')).not.toBeInTheDocument();
    });

    it('debe mostrar children si tiene permisos (ignorar fallback)', async () => {
      render(
        <Can
          perform="config.usuarios.listar"
          fallback={<p>Sin permisos</p>}
        >
          <button>Ver Usuarios</button>
        </Can>,
        { wrapper: createWrapper(['config.usuarios.listar']) }
      );

      await waitFor(() => {
        expect(screen.getByText('Ver Usuarios')).toBeInTheDocument();
      });
      expect(screen.queryByText('Sin permisos')).not.toBeInTheDocument();
    });
  });

  describe('Casos especiales', () => {
    it('debe manejar array vacío de permisos', () => {
      render(
        <Can perform={[]}>
          <button>Botón</button>
        </Can>,
        { wrapper: createWrapper(['config.usuarios.listar']) }
      );

      // Array vacío con requireAll=true (default) debería renderizar
      // porque "todos" los permisos del array vacío se cumplen
      expect(screen.getByText('Botón')).toBeInTheDocument();
    });

    it('debe manejar permisos con usuario sin permisos', () => {
      render(
        <Can perform="any.permission">
          <button>Botón</button>
        </Can>,
        { wrapper: createWrapper([]) }
      );

      expect(screen.queryByText('Botón')).not.toBeInTheDocument();
    });
  });
});
