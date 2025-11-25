/**
 * Tests para PermissionsContext
 * Siguiendo MEJORES_PRACTICAS.md - Testing
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PermissionsProvider, usePermissions } from './PermissionsContext';
import * as permissionsApi from '@/api/permissions.api';
import * as storage from '@/utils/storage';

// Mock de las APIs y storage
vi.mock('@/api/permissions.api');
vi.mock('@/utils/storage');

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <PermissionsProvider>{children}</PermissionsProvider>
    </QueryClientProvider>
  );
};

describe('PermissionsContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Carga de permisos', () => {
    it('debe cargar permisos cuando hay token', async () => {
      const mockPermissions = [
        'config.usuarios.listar',
        'config.usuarios.crear',
        'reservas.ver',
      ];

      vi.mocked(storage.getToken).mockReturnValue('mock-token');
      vi.mocked(permissionsApi.permissionsApi.getPermissions).mockResolvedValue(
        mockPermissions
      );

      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.permissions).toEqual(new Set(mockPermissions));
    });

    it('no debe cargar permisos sin token', () => {
      vi.mocked(storage.getToken).mockReturnValue(null);

      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(),
      });

      expect(result.current.permissions).toEqual(new Set());
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('hasPermission', () => {
    it('debe retornar true si el usuario tiene el permiso', async () => {
      const mockPermissions = [
        'config.usuarios.listar',
        'config.usuarios.crear',
      ];

      vi.mocked(storage.getToken).mockReturnValue('token');
      vi.mocked(permissionsApi.permissionsApi.getPermissions).mockResolvedValue(
        mockPermissions
      );

      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.hasPermission('config.usuarios.listar')).toBe(true);
      expect(result.current.hasPermission('config.usuarios.crear')).toBe(true);
    });

    it('debe retornar false si el usuario NO tiene el permiso', async () => {
      const mockPermissions = ['config.usuarios.listar'];

      vi.mocked(storage.getToken).mockReturnValue('token');
      vi.mocked(permissionsApi.permissionsApi.getPermissions).mockResolvedValue(
        mockPermissions
      );

      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.hasPermission('config.usuarios.eliminar')).toBe(
        false
      );
    });
  });

  describe('hasAllPermissions', () => {
    it('debe retornar true si tiene TODOS los permisos', async () => {
      const mockPermissions = [
        'config.usuarios.listar',
        'config.usuarios.crear',
        'config.usuarios.editar',
      ];

      vi.mocked(storage.getToken).mockReturnValue('token');
      vi.mocked(permissionsApi.permissionsApi.getPermissions).mockResolvedValue(
        mockPermissions
      );

      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(
        result.current.hasAllPermissions([
          'config.usuarios.listar',
          'config.usuarios.crear',
        ])
      ).toBe(true);
    });

    it('debe retornar false si falta algún permiso', async () => {
      const mockPermissions = ['config.usuarios.listar'];

      vi.mocked(storage.getToken).mockReturnValue('token');
      vi.mocked(permissionsApi.permissionsApi.getPermissions).mockResolvedValue(
        mockPermissions
      );

      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(
        result.current.hasAllPermissions([
          'config.usuarios.listar',
          'config.usuarios.eliminar',
        ])
      ).toBe(false);
    });
  });

  describe('hasAnyPermission', () => {
    it('debe retornar true si tiene AL MENOS UNO de los permisos', async () => {
      const mockPermissions = ['config.usuarios.listar'];

      vi.mocked(storage.getToken).mockReturnValue('token');
      vi.mocked(permissionsApi.permissionsApi.getPermissions).mockResolvedValue(
        mockPermissions
      );

      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(
        result.current.hasAnyPermission([
          'config.usuarios.listar',
          'config.usuarios.eliminar',
        ])
      ).toBe(true);
    });

    it('debe retornar false si NO tiene ninguno de los permisos', async () => {
      const mockPermissions = ['config.usuarios.listar'];

      vi.mocked(storage.getToken).mockReturnValue('token');
      vi.mocked(permissionsApi.permissionsApi.getPermissions).mockResolvedValue(
        mockPermissions
      );

      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(
        result.current.hasAnyPermission([
          'config.usuarios.crear',
          'config.usuarios.eliminar',
        ])
      ).toBe(false);
    });
  });

  describe('Cache de permisos', () => {
    it('debe cachear permisos en localStorage', async () => {
      const mockPermissions = ['config.usuarios.listar'];

      vi.mocked(storage.getToken).mockReturnValue('token');
      vi.mocked(permissionsApi.permissionsApi.getPermissions).mockResolvedValue(
        mockPermissions
      );

      renderHook(() => usePermissions(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(storage.setItem).toHaveBeenCalled();
      });

      // Verificar que se guardó el array de permisos
      const calls = vi.mocked(storage.setItem).mock.calls;
      expect(calls.length).toBeGreaterThan(0);
      expect(calls[0][1]).toEqual(['config.usuarios.listar']);
    });
  });
});
