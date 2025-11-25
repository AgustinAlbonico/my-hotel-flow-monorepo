/**
 * Types para respuestas API estandarizadas
 * Siguiendo MEJORES_PRACTICAS.md - Estructura estándar de respuestas API
 * Debe coincidir con backend/src/common/interfaces/api-response.interface.ts
 */

/**
 * Metadata común para todas las respuestas
 */
export interface ApiMetadata extends Record<string, unknown> {
  timestamp: string;
  requestId: string;
}

/**
 * Metadata de paginación
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Respuesta exitosa genérica
 */
export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data?: T;
  message?: string;
  pagination?: PaginationMeta;
  meta: ApiMetadata;
}

/**
 * Detalle de error de validación
 */
export interface ValidationErrorDetail {
  field: string;
  message: string;
  constraint?: string;
  value?: unknown;
}

/**
 * Error de API
 */
export interface ApiErrorDetail extends Record<string, unknown> {
  code: string;
  message: string;
  details?: ValidationErrorDetail[] | unknown;
  errorId?: string;
  resource?: string;
  resourceId?: number | string;
  conflictField?: string;
  conflictValue?: unknown;
  requiredPermissions?: string[];
}

/**
 * Respuesta de error
 */
export interface ApiErrorResponse {
  success: false;
  error: ApiErrorDetail;
  meta: ApiMetadata;
}

/**
 * Unión de tipos de respuesta
 */
export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Type guard para verificar si es una respuesta exitosa
 */
export function isSuccessResponse<T>(
  response: ApiResponse<T>
): response is ApiSuccessResponse<T> {
  return response.success === true;
}

/**
 * Type guard para verificar si es una respuesta de error
 */
export function isErrorResponse(
  response: ApiResponse
): response is ApiErrorResponse {
  return response.success === false;
}

/**
 * Helper para extraer datos de una respuesta exitosa
 * Lanza un error si la respuesta es de error
 */
export function extractData<T>(response: ApiResponse<T>): T {
  if (isSuccessResponse(response)) {
    return response.data as T;
  }
  throw new Error(response.error.message);
}

/**
 * Helper para extraer error de una respuesta
 * Retorna null si la respuesta es exitosa
 */
export function extractError(
  response: ApiResponse
): ApiErrorDetail | null {
  if (isErrorResponse(response)) {
    return response.error;
  }
  return null;
}
