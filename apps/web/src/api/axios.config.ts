/**
 * Configuración de Axios con interceptors
 * Siguiendo MEJORES_PRACTICAS.md - Manejo de autenticación, refresh tokens y respuestas API estandarizadas
 */
import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { API_URL, TOKEN_KEY, REFRESH_TOKEN_KEY } from '@/config/constants';
import { getToken, setToken, removeToken } from '@/utils/storage';
import type { ApiSuccessResponse, ApiErrorResponse } from '@/types/api.types';

/**
 * Error enriquecido con información de la API
 */
interface EnhancedApiError extends Error {
  code: string;
  details?: unknown;
  statusCode: number;
  originalError: AxiosError;
}

// Crear instancia de axios con configuración base
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - agregar token de autorización
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken(TOKEN_KEY);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Variables para manejo de refresh token
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

// Response interceptor - manejo de respuestas estandarizadas, errores y refresh automático
api.interceptors.response.use(
  (response: AxiosResponse<ApiSuccessResponse>) => {
    // La API ahora devuelve siempre la estructura estándar con success, data, meta
    // Extraer solo los datos para facilitar el uso en los componentes
    if (response.data && typeof response.data === 'object' && 'success' in response.data) {
      const standardResponse = response.data as ApiSuccessResponse;

      // Si tiene paginación, devolver ambos
      if (standardResponse.pagination) {
        response.data = {
          data: standardResponse.data,
          pagination: standardResponse.pagination,
        } as ApiSuccessResponse;
      } else {
        // Solo devolver los datos, pero mantener acceso a meta si es necesario
        response.data = standardResponse.data as ApiSuccessResponse;
      }
    }
    return response;
  },
  async (error: AxiosError<ApiErrorResponse>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Si es 401 y no es el endpoint de login o refresh
    const isLoginRequest = originalRequest.url?.includes('/auth/login');
    const isRefreshRequest = originalRequest.url?.includes('/auth/refresh');
    
    if (
      error.response?.status === 401 && 
      !originalRequest._retry && 
      !isLoginRequest && 
      !isRefreshRequest
    ) {
      if (isRefreshing) {
        // Agregar request a la cola
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = getToken(REFRESH_TOKEN_KEY);

      if (!refreshToken) {
        // No hay refresh token, cerrar sesión
        removeToken(TOKEN_KEY);
        removeToken(REFRESH_TOKEN_KEY);
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        // Intentar refrescar el token
        const response = await axios.post<ApiSuccessResponse<{ accessToken: string; refreshToken: string }>>(
          `${API_URL}/auth/refresh`,
          { refreshToken },
        );

        // Extraer datos de la estructura estándar
        const responseData = response.data.success && response.data.data ? response.data.data : response.data;
        const { accessToken, refreshToken: newRefreshToken } = responseData as { accessToken: string; refreshToken: string };

        setToken(TOKEN_KEY, accessToken);
        setToken(REFRESH_TOKEN_KEY, newRefreshToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }

        processQueue(null, accessToken);
        isRefreshing = false;

        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as Error, null);
        isRefreshing = false;

        // Refresh falló, cerrar sesión
        removeToken(TOKEN_KEY);
        removeToken(REFRESH_TOKEN_KEY);
        window.location.href = '/login';

        return Promise.reject(refreshError);
      }
    }

    // Enriquecer el error con información de la respuesta estándar
    if (error.response?.data && typeof error.response.data === 'object') {
      const errorData = error.response.data as ApiErrorResponse;

      if (!errorData.success && errorData.error) {
        // Crear un error más informativo
        const enhancedError = new Error(errorData.error.message) as EnhancedApiError;
        enhancedError.code = errorData.error.code;
        enhancedError.details = errorData.error.details;
        enhancedError.statusCode = error.response.status;
        enhancedError.originalError = error;

        return Promise.reject(enhancedError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
