/**
 * Account Movements API Client
 */
import api from './axios.config';
import type { AccountStatementResponse } from '../types/account-movement.types';

export const accountMovementsApi = {
  /**
   * Obtener estado de cuenta de un cliente
   */
  getAccountStatement: async (
    clientId: number,
    page: number = 1,
    limit: number = 50,
  ): Promise<AccountStatementResponse> => {
    const response = await api.get(
      `/account-statements/client/${clientId}?page=${page}&limit=${limit}`,
    );

    // El interceptor de Axios retorna { data, pagination } cuando detecta paginación
    // En este caso necesitamos el objeto completo del estado de cuenta.
    if (response.data && 'data' in response.data) {
      return response.data.data as AccountStatementResponse;
    }

    return response.data as AccountStatementResponse;
  },
};
