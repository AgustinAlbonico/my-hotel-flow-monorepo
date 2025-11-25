/**
 * Custom Hook para gestión de tipos de habitación
 * Siguiendo MEJORES_PRACTICAS.md - Custom Hooks + React Query
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  roomTypesApi,
  CreateRoomTypeRequest,
  UpdateRoomTypeRequest,
  RoomTypeResponse,
} from '@/api/roomTypes.api';

export const useRoomTypes = () => {
  const queryClient = useQueryClient();

  // Query: Listar tipos de habitación
  const { data: roomTypes, isLoading, error } = useQuery({
    queryKey: ['room-types'],
    queryFn: async () => {
      const response = await roomTypesApi.getRoomTypes();
      
      // Si response es directamente el array
      if (Array.isArray(response)) {
        return response;
      }
      // Si response tiene la propiedad data
      if (response && response.data) {
        return response.data;
      }
      return [];
    },
  });

  // Query: Listar solo tipos activos
  const { data: activeRoomTypes, isLoading: loadingActive } = useQuery({
    queryKey: ['room-types', 'active'],
    queryFn: async () => {
      const response = await roomTypesApi.getRoomTypes(true);
      
      if (Array.isArray(response)) {
        return response;
      }
      if (response && response.data) {
        return response.data;
      }
      return [];
    },
  });

  // Mutation: Crear tipo de habitación
  const createMutation = useMutation({
    mutationFn: (data: CreateRoomTypeRequest) => roomTypesApi.createRoomType(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['room-types'] });
    },
  });

  // Mutation: Actualizar tipo de habitación
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateRoomTypeRequest }) =>
      roomTypesApi.updateRoomType(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['room-types'] });
    },
  });

  // Mutation: Eliminar tipo de habitación
  const deleteMutation = useMutation({
    mutationFn: (id: number) => roomTypesApi.deleteRoomType(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['room-types'] });
    },
  });

  return {
    roomTypes: roomTypes || [],
    activeRoomTypes: activeRoomTypes || [],
    isLoading,
    loadingActive,
    error,
    createRoomType: createMutation.mutateAsync,
    updateRoomType: updateMutation.mutateAsync,
    deleteRoomType: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};

/**
 * Hook para obtener un tipo de habitación por ID
 */
export const useRoomTypeById = (id: number | undefined) => {
  return useQuery({
    queryKey: ['room-types', id],
    queryFn: async () => {
      if (!id) return null;
      const response = await roomTypesApi.getRoomTypeById(id);
      
      // La API puede devolver el objeto directamente o envuelto en { data: ... }
      // Manejamos ambos casos como en useRoomTypes
      if (response.data) {
        return response.data as RoomTypeResponse;
      }
      // Si response es el objeto directamente (tiene id, code, name, etc)
      if (response && typeof response === 'object' && 'id' in response) {
        return response as unknown as RoomTypeResponse;
      }
      return null;
    },
    enabled: !!id, // Solo ejecutar si id está definido
  });
};
