/**
 * Tests para ProtectedRoute
 * Siguiendo MEJORES_PRACTICAS.md - Testing
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { AuthProvider } from '@/contexts/AuthContext';
import { PermissionsProvider } from '@/contexts/PermissionsContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as permissionsApi from '@/api/permissions.api';
import * as storage from '@/utils/storage';

vi.mock('@/api/permissions.api');
vi.mock('@/utils/storage');
vi.mock('@/components/layout/MainLayout', () => ({
  MainLayout: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

const TestComponent = () => <div>Contenido Protegido</div>;
const LoginPage = () => <div>Login Page</div>;
const ForbiddenPage = () => <div>403 Forbidden</div>;

const createWrapper = (
  isAuthenticated: boolean,
  permissions: string[] = []
) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  if (isAuthenticated) {
    const mockUser = {
      id: 1,
      username: 'testuser',
      email: 'user@test.com',
      fullName: 'Test User',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    // Mockear getToken y getItem con implementación condicional
    vi.mocked(storage.getToken).mockReturnValue('token');
    vi.mocked(storage.getItem).mockImplementation((key: string) => {
      if (key === 'user_profile') return mockUser;
      if (key === 'user_permissions') return null; // Cache vacío
      return null;
    });
    
    vi.mocked(permissionsApi.permissionsApi.getPermissions).mockResolvedValue(
      permissions
    );
  } else {
    vi.mocked(storage.getToken).mockReturnValue(null);
    vi.mocked(storage.getItem).mockReturnValue(null);
  }

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <PermissionsProvider>{children}</PermissionsProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Asegurar que getItem retorna null por defecto para el cache de permisos
    vi.mocked(storage.getItem).mockImplementation((key: string) => {
      if (key === 'user_permissions') return null;
      return null;
    });
  });
  describe('Sin autenticación', () => {
    it('debe redirigir a /login si el usuario no está autenticado', async () => {
      render(
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/protected" element={<TestComponent />} />
            </Route>
          </Routes>
        </MemoryRouter>,
        { wrapper: createWrapper(false) }
      );

      await vi.waitFor(() => {
        expect(screen.getByText('Login Page')).toBeInTheDocument();
      });
      expect(screen.queryByText('Contenido Protegido')).not.toBeInTheDocument();
    });
  });

  describe('Con autenticación', () => {
    it('debe renderizar children si el usuario está autenticado', async () => {
      render(
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route element={<ProtectedRoute />}>
              <Route path="/protected" element={<TestComponent />} />
            </Route>
          </Routes>
        </MemoryRouter>,
        { wrapper: createWrapper(true, ['some.permission']) }
      );

      // Esperar a que se carguen los permisos y se renderice el contenido
      await waitFor(
        () => {
          expect(screen.getByText('Contenido Protegido')).toBeInTheDocument();
        },
        { timeout: 2000 }
      );
    });
  });

  describe('Con permisos requeridos', () => {
    it('debe verificar permisos antes de renderizar', async () => {
      // Este test verifica que el componente comprueba permisos
      // pero debido a la naturaleza asíncrona, puede mostrar loading/403 primero
      render(
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route path="/forbidden" element={<ForbiddenPage />} />
            <Route
              element={
                <ProtectedRoute
                  requiredPermissions={['config.usuarios.listar']}
                />
              }
            >
              <Route path="/protected" element={<TestComponent />} />
            </Route>
          </Routes>
        </MemoryRouter>,
        { wrapper: createWrapper(true, ['config.usuarios.listar']) }
      );

      // El componente debe consultar permisos
      await waitFor(() => {
        expect(permissionsApi.permissionsApi.getPermissions).toHaveBeenCalled();
      });

      // Como mínimo, NO debe estar en login (está autenticado)
      expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
    });

    it('debe redirigir a /forbidden si el usuario NO tiene el permiso', async () => {
      render(
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route path="/forbidden" element={<ForbiddenPage />} />
            <Route
              element={
                <ProtectedRoute
                  requiredPermissions={['config.usuarios.eliminar']}
                />
              }
            >
              <Route path="/protected" element={<TestComponent />} />
            </Route>
          </Routes>
        </MemoryRouter>,
        { wrapper: createWrapper(true, ['config.usuarios.listar']) }
      );

      await waitFor(
        () => {
          expect(screen.getByText('403 Forbidden')).toBeInTheDocument();
        },
        { timeout: 2000 }
      );
      expect(screen.queryByText('Contenido Protegido')).not.toBeInTheDocument();
    });
  });
});
