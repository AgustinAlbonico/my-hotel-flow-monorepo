/**
 * Types de Sistema de Permisos
 * Siguiendo MEJORES_PRACTICAS.md - Type safety
 */

export interface PermissionsContextValue {
  permissions: Set<string>;
  isLoading: boolean;
  hasPermission: (action: string) => boolean;
  hasAllPermissions: (actions: string[]) => boolean;
  hasAnyPermission: (actions: string[]) => boolean;
  refetchPermissions: () => Promise<void>;
}
