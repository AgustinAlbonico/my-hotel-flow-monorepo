import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

/**
 * Estructura estándar de respuesta de error de la API
 */
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    errorId?: string;
  };
  meta: {
    timestamp: string;
    requestId: string;
  };
}

/**
 * Global Catch-All Exception Filter
 *
 * Este filtro captura CUALQUIER error no manejado por los filtros específicos
 * (DomainExceptionFilter, HttpExceptionFilter) y devuelve una respuesta genérica
 * de error 500 con un errorId para trazabilidad.
 *
 * IMPORTANTE: Este debe ser el ÚLTIMO filtro en la cadena (registrado primero en main.ts)
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const requestId = (request.headers['x-request-id'] as string) || uuidv4();

    const errorId = uuidv4();

    // Log completo del error para debugging interno
    if (exception instanceof Error) {
      this.logger.error(
        `[${requestId}] Unhandled Exception (errorId: ${errorId}):`,
        exception.stack || exception.message,
      );
    } else {
      this.logger.error(
        `[${requestId}] Unknown Exception (errorId: ${errorId}):`,
        exception,
      );
    }

    // Respuesta genérica al cliente (no exponer detalles internos)
    const errorResponse: ApiErrorResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message:
          'Ha ocurrido un error inesperado. Por favor, intenta nuevamente.',
        errorId,
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
      },
    };

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse);
  }
}
