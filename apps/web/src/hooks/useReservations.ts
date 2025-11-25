/**
 * Custom Hook - useReservations
 * Siguiendo MEJORES_PRACTICAS.md - Hooks personalizados
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { reservationsApi } from '@/api/reservations.api';

/**
 * Hook para obtener reservas activas (IN_PROGRESS)
 */
export const useActiveReservations = () => {
  return useQuery({
    queryKey: ['reservations', 'active'],
    queryFn: reservationsApi.getActiveReservations,
  });
};

/**
 * Hook para obtener reservas confirmadas (CONFIRMED - pendientes de check-in)
 */
export const useConfirmedReservations = () => {
  return useQuery({
    queryKey: ['reservations', 'confirmed'],
    queryFn: reservationsApi.getConfirmedReservations,
  });
};

/**
 * Hook para realizar check-in
 */
export const useCheckIn = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      reservationId,
      documentsVerified,
    }: {
      reservationId: number;
      documentsVerified?: boolean;
    }) =>
      reservationsApi.performCheckIn(reservationId, { documentsVerified }),
    onSuccess: () => {
      // Invalidar cache de reservas
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      // Invalidar cache de habitaciones
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
  });
};

/**
 * Hook para realizar check-out
 */
export const useCheckOut = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      reservationId,
      roomCondition,
      observations,
    }: {
      reservationId: number;
      roomCondition: 'GOOD' | 'REGULAR' | 'NEEDS_DEEP_CLEANING';
      observations?: string;
    }) =>
      reservationsApi.performCheckOut(reservationId, {
        roomCondition,
        observations,
      }),
    onSuccess: () => {
      // Invalidar cache de reservas activas
      queryClient.invalidateQueries({ queryKey: ['reservations', 'active'] });
      // Invalidar cache de habitaciones (por si cambia el estado)
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      // Invalidar cache de facturas
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
};
