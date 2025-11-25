/**
 * Custom Hook para gestión de usuarios
 * Siguiendo MEJORES_PRACTICAS.md - Custom Hooks + React Query
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi, GetUsersParams } from '@/api/users.api';
import type {
  UpdateUserPayload,
  SetUserGroupsPayload,
  SetUserActionsPayload,
  ResetPasswordPayload,
} from '@/types/user.types';

export const useUsers = (params?: GetUsersParams) => {
  const queryClient = useQueryClient();

  // Query: Listar usuarios con paginación y filtros
  const { data, isLoading, error } = useQuery({
    queryKey: ['users', params],
    queryFn: () => usersApi.getAll(params),
  });

  const users = data?.data || [];
  const pagination = data?.pagination;

  // Query: Obtener usuario por ID
  const useUser = (id: number) =>
    useQuery({
      queryKey: ['users', id],
      queryFn: () => usersApi.getById(id),
      enabled: !!id,
    });

  // Mutation: Crear usuario
  const createMutation = useMutation({
    mutationFn: usersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  // Mutation: Actualizar usuario
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateUserPayload }) =>
      usersApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  // Mutation: Eliminar usuario
  const deleteMutation = useMutation({
    mutationFn: usersApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  // Mutation: Asignar grupos
  const setGroupsMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: SetUserGroupsPayload }) =>
      usersApi.setGroups(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  // Mutation: Asignar acciones
  const setActionsMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: SetUserActionsPayload }) =>
      usersApi.setActions(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  // Mutation: Resetear contraseña
  const resetPasswordMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ResetPasswordPayload }) =>
      usersApi.resetPassword(id, payload),
  });

  return {
    users,
    pagination,
    isLoading,
    error,
    useUser,
    createUser: createMutation.mutateAsync,
    updateUser: updateMutation.mutateAsync,
    deleteUser: deleteMutation.mutateAsync,
    setGroups: setGroupsMutation.mutateAsync,
    setActions: setActionsMutation.mutateAsync,
    resetPassword: resetPasswordMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};

/**
 * Hook para obtener acciones heredadas de los grupos del usuario
 */
export const useUserInheritedActions = (userId: number) => {
  return useQuery({
    queryKey: ['users', userId, 'inherited-actions'],
    queryFn: () => usersApi.getInheritedActions(userId),
    enabled: !!userId,
  });
};
