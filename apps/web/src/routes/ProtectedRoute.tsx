/**
 * Protected Route - Protección de rutas con autenticación y permisos
 * Siguiendo MEJORES_PRACTICAS.md - Seguridad y control de acceso
 */
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/contexts/PermissionsContext';
import { MainLayout } from '@/components/layout/MainLayout';

interface ProtectedRouteProps {
  requiredPermissions?: string[];
  requireAll?: boolean; // true = AND, false = OR
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  requiredPermissions = [],
  requireAll = true,
}) => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { hasAllPermissions, hasAnyPermission, isLoading: permsLoading } = usePermissions();

  // Mostrar spinner mientras carga
  if (authLoading || permsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-primary-600"></div>
      </div>
    );
  }

  // Si no está autenticado, redirigir a login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Si requiere permisos específicos, verificar
  if (requiredPermissions.length > 0) {
    const hasAccess = requireAll
      ? hasAllPermissions(requiredPermissions)
      : hasAnyPermission(requiredPermissions);

    if (!hasAccess) {
      return <Navigate to="/forbidden" replace />;
    }
  }

  // Todo OK, renderizar la ruta con layout
  return (
    <MainLayout>
      <Outlet />
    </MainLayout>
  );
};
