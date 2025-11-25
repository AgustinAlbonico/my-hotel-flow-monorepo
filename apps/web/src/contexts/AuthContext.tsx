/**
 * Auth Context - Manejo global de autenticación
 * Siguiendo MEJORES_PRACTICAS.md - Context Pattern + React Query
 */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/api/auth.api';
import {
  User,
  LoginCredentials,
  ChangePasswordPayload,
  AuthContextValue,
} from '@/types/auth.types';
import {
  getToken,
  setToken,
  removeToken,
  setItem,
  getItem,
  clearStorage,
} from '@/utils/storage';
import { TOKEN_KEY, REFRESH_TOKEN_KEY, USER_PROFILE_KEY } from '@/config/constants';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  // Cargar usuario del storage al montar
  useEffect(() => {
    const token = getToken(TOKEN_KEY);
    const savedUser = getItem<User>(USER_PROFILE_KEY);

    if (token && savedUser) {
      setUser(savedUser);
    }
    setIsLoading(false);
  }, []);

  // Query para obtener perfil (deshabilitado por ahora)
  // Se puede usar en el futuro para refrescar manualmente el perfil del usuario
  // const { refetch: refetchProfile } = useQuery({
  //   queryKey: ['auth', 'profile'],
  //   queryFn: authApi.getProfile,
  //   enabled: false,
  // });

  // Mutation: Login
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      // 1. Hacer login y obtener tokens
      const loginResponse = await authApi.login(credentials);
      
      // 2. Guardar tokens inmediatamente
      setToken(TOKEN_KEY, loginResponse.accessToken);
      setToken(REFRESH_TOKEN_KEY, loginResponse.refreshToken);
      
      // 3. Obtener perfil del usuario con los tokens
      const userProfile = await authApi.getProfile();
      
      return {
        ...loginResponse,
        user: userProfile,
      };
    },
    onSuccess: (data) => {
      // Guardar usuario en storage
      setItem(USER_PROFILE_KEY, data.user);
      
      // Actualizar estado del usuario INMEDIATAMENTE
      setUser(data.user);

      // Los permisos se cargarán automáticamente por el PermissionsContext
    },
    onError: () => {
      // No hacer nada - el usuario ya es null cuando intenta login
      // Solo limpiar tokens si existen (pueden haber quedado de intentos previos)
      removeToken(TOKEN_KEY);
      removeToken(REFRESH_TOKEN_KEY);
    },
  });

  // Mutation: Logout
  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      // Limpiar todo independientemente de si el API call fue exitoso
      removeToken(TOKEN_KEY);
      removeToken(REFRESH_TOKEN_KEY);
      clearStorage();
      setUser(null);
      queryClient.clear();
    },
  });

  // Mutation: Change Password
  const changePasswordMutation = useMutation({
    mutationFn: authApi.changePassword,
  });

  const login = async (credentials: LoginCredentials): Promise<void> => {
    await loginMutation.mutateAsync(credentials);
  };

  const logout = async (): Promise<void> => {
    await logoutMutation.mutateAsync();
  };

  const changePassword = async (payload: ChangePasswordPayload): Promise<void> => {
    await changePasswordMutation.mutateAsync(payload);
  };

  const value: AuthContextValue = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    changePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Este hook se exporta junto con el provider por diseño para simplificar el consumo del contexto
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
