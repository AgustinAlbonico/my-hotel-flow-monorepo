/**
 * Permissions Context - Manejo global de permisos
 * Siguiendo MEJORES_PRACTICAS.md - Context Pattern + React Query
 */
import React, { createContext, useContext, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { permissionsApi } from '@/api/permissions.api';
import { PermissionsContextValue } from '@/types/permissions.types';
import { setItem, removeToken } from '@/utils/storage';
import { PERMISSIONS_CACHE_KEY } from '@/config/constants';
import { useAuth } from './AuthContext';

const PermissionsContext = createContext<PermissionsContextValue | undefined>(
  undefined
);

export const PermissionsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated } = useAuth();

  // Query para obtener permisos del usuario
  // Se ejecuta automáticamente cuando isAuthenticated cambia a true
  const { data, isLoading, isFetching, refetch } = useQuery<string[]>({
    queryKey: ['permissions'],
    queryFn: permissionsApi.getPermissions,
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutos - mantener permisos frescos pero usables
    gcTime: 30 * 60 * 1000, // 30 minutos - mantener en caché más tiempo
    refetchOnWindowFocus: true, // Refrescar al volver a la pestaña
    refetchOnMount: true, // Refrescar si los datos son stale
  });

  // Derivar permissions directamente de data (no usar state separado)
  const permissions = React.useMemo<Set<string>>(() => {
    if (data) {
      // Guardar en localStorage cuando hay datos nuevos
      setItem(PERMISSIONS_CACHE_KEY, data);
      return new Set(data);
    }
    // Si no hay data, intentar cargar del localStorage
    const cached = localStorage.getItem(PERMISSIONS_CACHE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        return new Set(parsed);
      } catch {
        return new Set();
      }
    }
    return new Set();
  }, [data]);

  // Limpiar permisos cuando el usuario cierra sesión
  useEffect(() => {
    if (!isAuthenticated) {
      removeToken(PERMISSIONS_CACHE_KEY);
    }
  }, [isAuthenticated]);

  const hasPermission = (action: string): boolean => {
    return permissions.has(action);
  };

  const hasAllPermissions = (actions: string[]): boolean => {
    return actions.every((action) => permissions.has(action));
  };

  const hasAnyPermission = (actions: string[]): boolean => {
    return actions.some((action) => permissions.has(action));
  };

  const refetchPermissions = async (): Promise<void> => {
    await refetch();
  };

  // Si estamos autenticados Y (estamos cargando O no tenemos datos todavía),
  // consideramos que estamos cargando
  const effectiveIsLoading = isAuthenticated && (isLoading || (!data && isFetching));

  const value: PermissionsContextValue = {
    permissions,
    isLoading: effectiveIsLoading,
    hasPermission,
    hasAllPermissions,
    hasAnyPermission,
    refetchPermissions,
  };

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
};

// Este hook se exporta junto con el provider por diseño para simplificar el consumo del contexto
// eslint-disable-next-line react-refresh/only-export-components
export const usePermissions = (): PermissionsContextValue => {
  const context = useContext(PermissionsContext);
  if (context === undefined) {
    throw new Error('usePermissions must be used within a PermissionsProvider');
  }
  return context;
};
