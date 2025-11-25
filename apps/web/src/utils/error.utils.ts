/**
 * Error Utilities
 * Funciones utilitarias para manejo consistente de errores de API
 */

/**
 * Estructura de error estándar de la API
 */
interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta: {
    timestamp: string;
    requestId: string;
  };
}

/**
 * Extrae el mensaje de error de una respuesta de API
 * Soporta tanto la estructura nueva (success/error/meta) como la antigua (message directamente)
 * 
 * @param error - Error capturado (típicamente de axios)
 * @param defaultMessage - Mensaje por defecto si no se puede extraer el mensaje
 * @returns Mensaje de error legible para el usuario
 */
export function getErrorMessage(error: unknown, defaultMessage = 'Ha ocurrido un error inesperado'): string {
  // Si el error es un objeto con response (típicamente axios)
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as {
      response?: {
        data?: ApiErrorResponse | { message?: string };
      };
    };

    // Intentar extraer de la estructura estándar nueva (error.message)
    if (axiosError.response?.data && 'error' in axiosError.response.data) {
      const apiError = axiosError.response.data as ApiErrorResponse;
      if (apiError.error?.message) {
        return apiError.error.message;
      }
    }

    // Fallback a la estructura antigua (message directamente)
    if (axiosError.response?.data && 'message' in axiosError.response.data) {
      const legacyError = axiosError.response.data as { message: string };
      if (legacyError.message) {
        return legacyError.message;
      }
    }
  }

  // Si es un Error nativo de JavaScript
  if (error instanceof Error && error.message) {
    return error.message;
  }

  // Fallback al mensaje por defecto
  return defaultMessage;
}

/**
 * Extrae el código de error de una respuesta de API
 * 
 * @param error - Error capturado
 * @returns Código de error o undefined
 */
export function getErrorCode(error: unknown): string | undefined {
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as {
      response?: {
        data?: ApiErrorResponse;
      };
    };

    if (axiosError.response?.data && 'error' in axiosError.response.data) {
      return axiosError.response.data.error.code;
    }
  }

  return undefined;
}
