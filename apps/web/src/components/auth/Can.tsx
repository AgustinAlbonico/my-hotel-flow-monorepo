/**
 * Componente Can - Renderizado condicional basado en permisos
 * Siguiendo MEJORES_PRACTICAS.md - Separación de concerns
 *
 * Ejemplos de uso:
 * <Can perform={Permission.CONFIG_USUARIOS_CREAR}>
 *   <button>Crear Usuario</button>
 * </Can>
 *
 * <Can perform={[Permission.CONFIG_USUARIOS_CREAR, Permission.CONFIG_USUARIOS_MODIFICAR]} requireAll={false}>
 *   <button>Gestionar Usuarios</button>
 * </Can>
 */
import React from 'react';
import { usePermissions } from '@/contexts/PermissionsContext';
import { Permission } from '@/types/permissions';

interface CanProps {
  perform: Permission | Permission[] | string | string[];
  requireAll?: boolean; // true = AND, false = OR
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const Can: React.FC<CanProps> = ({
  perform,
  requireAll = true,
  children,
  fallback = null,
}) => {
  const { hasPermission, hasAllPermissions, hasAnyPermission } = usePermissions();

  const permissions = Array.isArray(perform) ? perform : [perform];
  const permissionStrings = permissions.map(p => String(p));

  let hasAccess: boolean;

  if (permissionStrings.length === 1) {
    hasAccess = hasPermission(permissionStrings[0]);
  } else {
    hasAccess = requireAll
      ? hasAllPermissions(permissionStrings)
      : hasAnyPermission(permissionStrings);
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>;
};
