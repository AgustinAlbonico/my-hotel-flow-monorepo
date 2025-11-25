import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';

/**
 * Estructura estándar de respuesta exitosa de la API
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  pagination?: PaginationMeta;
  message?: string;
  meta: {
    timestamp: string;
    requestId: string;
    total?: number;
  };
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
 * Transform Interceptor
 * Patrón: Interceptor Pattern (NestJS)
 *
 * Responsabilidad: Envolver todas las respuestas exitosas en una estructura estándar
 * consistente con metadata de request ID y timestamp.
 *
 * Siguiendo: MEJORES_PRACTICAS.md - Sección 7.1 (Estructura estándar de respuestas API)
 */
@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    const request = context.switchToHttp().getRequest();
    const requestId = request.headers['x-request-id'] || uuidv4();

    return next.handle().pipe(
      map((data) => {
        // Si la respuesta ya tiene la estructura estándar, devolverla tal cual
        if (data && typeof data === 'object' && 'success' in data) {
          return data as ApiResponse<T>;
        }

        // Si la respuesta tiene paginación, estructurarla apropiadamente
        if (data && typeof data === 'object' && 'pagination' in data) {
          return {
            success: true,
            data: data.data,
            pagination: data.pagination,
            meta: {
              timestamp: new Date().toISOString(),
              requestId,
            },
          };
        }

        // Si la respuesta tiene mensaje (para operaciones sin contenido como DELETE)
        if (
          data &&
          typeof data === 'object' &&
          'message' in data &&
          !data.data
        ) {
          return {
            success: true,
            message: data.message,
            meta: {
              timestamp: new Date().toISOString(),
              requestId,
            },
          };
        }

        // Estructura estándar para respuestas exitosas simples
        const response: ApiResponse<T> = {
          success: true,
          data,
          meta: {
            timestamp: new Date().toISOString(),
            requestId,
          },
        };

        // Si es un array, incluir el total en meta
        if (Array.isArray(data)) {
          response.meta.total = data.length;
        }

        return response;
      }),
    );
  }
}
