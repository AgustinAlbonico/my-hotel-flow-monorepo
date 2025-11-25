/**
 * Account Movements React Query Hooks
 */
import { useQuery } from '@tanstack/react-query';
import { accountMovementsApi } from '../api/account-movements.api';

/**
 * Hook para obtener el estado de cuenta de un cliente
 */
export const useAccountStatement = (
  clientId: number | null,
  page: number = 1,
  limit: number = 50,
) => {
  return useQuery({
    queryKey: ['account-statement', clientId, page, limit],
    queryFn: () => {
      if (!clientId) throw new Error('Client ID is required');
      return accountMovementsApi.getAccountStatement(clientId, page, limit);
    },
    enabled: !!clientId,
  });
};
