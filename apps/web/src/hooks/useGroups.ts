/**
 * Custom Hook para gestión de grupos
 * Siguiendo MEJORES_PRACTICAS.md - Custom Hooks + React Query
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { groupsApi } from '@/api/groups.api';
import type {
  UpdateGroupPayload,
  SetGroupActionsPayload,
  SetGroupChildrenPayload,
} from '@/types/group.types';

export const useGroups = () => {
  const queryClient = useQueryClient();

  // Query: Listar grupos
  const { data: groups, isLoading, error } = useQuery({
    queryKey: ['groups'],
    queryFn: groupsApi.getAll,
  });

  // Query: Obtener grupo por ID
  const useGroup = (id: number) =>
    useQuery({
      queryKey: ['groups', id],
      queryFn: () => groupsApi.getById(id),
      enabled: !!id,
    });

  // Mutation: Crear grupo
  const createMutation = useMutation({
    mutationFn: groupsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  });

  // Mutation: Actualizar grupo
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateGroupPayload }) =>
      groupsApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  });

  // Mutation: Eliminar grupo
  const deleteMutation = useMutation({
    mutationFn: groupsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  });

  // Mutation: Asignar acciones
  const setActionsMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: SetGroupActionsPayload }) =>
      groupsApi.setActions(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  });

  // Mutation: Asignar grupos hijos
  const setChildrenMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: SetGroupChildrenPayload }) =>
      groupsApi.setChildren(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  });

  return {
    groups,
    isLoading,
    error,
    useGroup,
    createGroup: createMutation.mutateAsync,
    updateGroup: updateMutation.mutateAsync,
    deleteGroup: deleteMutation.mutateAsync,
    setActions: setActionsMutation.mutateAsync,
    setChildren: setChildrenMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
