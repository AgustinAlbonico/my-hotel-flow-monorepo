/**
 * Tests para AuthContext
 * Siguiendo MEJORES_PRACTICAS.md - Testing
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './AuthContext';
import * as authApi from '@/api/auth.api';
import * as storage from '@/utils/storage';

// Mock de las APIs y storage
vi.mock('@/api/auth.api');
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
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Estado inicial', () => {
    it('debe inicializar sin usuario autenticado', () => {
      vi.mocked(storage.getToken).mockReturnValue(null);
      
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });

    it('debe cargar usuario si existe token en storage', async () => {
      const mockUser = {
        id: 1,
        username: 'admin',
        email: 'admin@test.com',
        fullName: 'Admin User',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Mock: token y usuario guardados en storage
      vi.mocked(storage.getToken).mockReturnValue('mock-token');
      vi.mocked(storage.getItem).mockReturnValue(mockUser);

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      // El usuario debe cargarse del storage inmediatamente
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(mockUser);
    });
  });

  describe('Login', () => {
    it('debe autenticar usuario correctamente', async () => {
      const mockTokens = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresIn: 900,
      };

      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'user@test.com',
        fullName: 'Test User',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      vi.mocked(authApi.authApi.login).mockResolvedValue(mockTokens);
      vi.mocked(authApi.authApi.getProfile).mockResolvedValue(mockUser);
      vi.mocked(storage.getToken).mockReturnValue(null);

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.login({
          identity: 'user@test.com',
          password: 'password123',
        });
      });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      expect(result.current.user).toEqual(mockUser);
      expect(storage.setToken).toHaveBeenCalled();
    });

    it('debe manejar error de login', async () => {
      vi.mocked(authApi.authApi.login).mockRejectedValue(
        new Error('Credenciales inválidas')
      );
      vi.mocked(storage.getToken).mockReturnValue(null);

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        try {
          await result.current.login({
            identity: 'wrong@test.com',
            password: 'wrong',
          });
        } catch (error) {
          expect(error).toBeDefined();
        }
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });
  });

  describe('Logout', () => {
    it('debe limpiar estado y storage al hacer logout', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'user@test.com',
        fullName: 'Test User',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Configurar estado inicial: usuario ya logueado
      vi.mocked(storage.getToken).mockReturnValue('token');
      vi.mocked(storage.getItem).mockReturnValue(mockUser);
      vi.mocked(authApi.authApi.logout).mockResolvedValue();

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      // Esperar a que cargue el usuario del storage
      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      // Hacer logout
      await act(async () => {
        await result.current.logout();
      });

      expect(storage.removeToken).toHaveBeenCalled();
      expect(storage.clearStorage).toHaveBeenCalled();
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('Cambio de contraseña', () => {
    it('debe cambiar contraseña correctamente', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'user@test.com',
        fullName: 'Test User',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Usuario ya logueado
      vi.mocked(storage.getToken).mockReturnValue('token');
      vi.mocked(storage.getItem).mockReturnValue(mockUser);
      vi.mocked(authApi.authApi.changePassword).mockResolvedValue();

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      await act(async () => {
        await result.current.changePassword({
          currentPassword: 'oldpass',
          newPassword: 'newpass',
        });
      });

      // React Query pasa parámetros extra, solo verificamos el primer argumento
      expect(authApi.authApi.changePassword).toHaveBeenCalled();
      const callArgs = vi.mocked(authApi.authApi.changePassword).mock.calls[0];
      expect(callArgs[0]).toEqual({
        currentPassword: 'oldpass',
        newPassword: 'newpass',
      });
    });
  });
});
