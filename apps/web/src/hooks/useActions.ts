/**
 * Custom Hook para gestión de acciones
 * Siguiendo MEJORES_PRACTICAS.md - Custom Hooks + React Query
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { actionsApi } from '@/api/actions.api';
import type { UpdateActionPayload } from '@/types/action.types';

export const useActions = () => {
  const queryClient = useQueryClient();

  // Query: Listar acciones
  const { data: actions, isLoading, error } = useQuery({
    queryKey: ['actions'],
    queryFn: actionsApi.getAll,
  });

  // Query: Obtener acción por ID
  const useAction = (id: number) =>
    useQuery({
      queryKey: ['actions', id],
      queryFn: () => actionsApi.getById(id),
      enabled: !!id,
    });

  // Mutation: Crear acción
  const createMutation = useMutation({
    mutationFn: actionsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['actions'] });
    },
  });

  // Mutation: Actualizar acción
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateActionPayload }) =>
      actionsApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['actions'] });
    },
  });

  // Mutation: Eliminar acción
  const deleteMutation = useMutation({
    mutationFn: actionsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['actions'] });
    },
  });

  return {
    actions,
    isLoading,
    error,
    useAction,
    createAction: createMutation.mutateAsync,
    updateAction: updateMutation.mutateAsync,
    deleteAction: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
