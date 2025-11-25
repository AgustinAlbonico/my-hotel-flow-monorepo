import { ExceptionFilter, Catch, ArgumentsHost, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { DomainException } from '../../domain/exceptions/domain.exception';

/**
 * Estructura estándar de respuesta de error de la API
 */
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
    [key: string]: unknown;
  };
  meta: {
    timestamp: string;
    requestId: string;
  };
}

/**
 * Global Exception Filter para manejar excepciones de dominio
 *
 * Convierte todas las excepciones que extienden de DomainException
 * en respuestas HTTP apropiadas siguiendo el principio de que
 * el dominio no debe conocer HTTP y la estructura estándar de respuestas de la API.
 */
@Catch(DomainException)
export class DomainExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(DomainExceptionFilter.name);

  catch(exception: DomainException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const requestId = (request.headers['x-request-id'] as string) || uuidv4();

    // Log de la excepción
    this.logger.warn(
      `[${requestId}] ${exception.errorCode}: ${exception.message}`,
    );

    const errorResponse: ApiErrorResponse = {
      success: false,
      error: {
        code: exception.errorCode,
        message: exception.message,
        ...(exception.metadata || {}),
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
      },
    };

    response.status(exception.httpStatus).json(errorResponse);
  }
}
