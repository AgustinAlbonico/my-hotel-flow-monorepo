import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
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
    details?: unknown;
    requiredPermissions?: string[];
    conflictField?: string;
    conflictValue?: unknown;
    resource?: string;
    resourceId?: number | string;
    errorId?: string;
  };
  meta: {
    timestamp: string;
    requestId: string;
  };
}

/**
 * HTTP Exception Filter
 * Patrón: Exception Filter Pattern (NestJS)
 *
 * Responsabilidad: Capturar excepciones HTTP y formatearlas en una estructura
 * estándar de error consistente con la API.
 *
 * NOTA: Las excepciones de dominio son manejadas por DomainExceptionFilter
 *
 * Siguiendo: MEJORES_PRACTICAS.md - Sección 7.1 (Estructura estándar de respuestas API)
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const requestId = (request.headers['x-request-id'] as string) || uuidv4();

    const status = exception.getStatus();
    let errorCode = 'HTTP_EXCEPTION';
    let message = 'An error occurred';
    let details: unknown = undefined;
    const additionalFields: Record<string, unknown> = {};

    const exceptionResponse = exception.getResponse();

    if (typeof exceptionResponse === 'object') {
      const responseObj = exceptionResponse as Record<string, unknown>;
      message = (responseObj.message as string) || message;
      errorCode = this.mapStatusToErrorCode(
        status,
        responseObj.error as string,
      );
      details = responseObj.details;

      // Campos adicionales específicos
      if (responseObj.requiredPermissions) {
        additionalFields.requiredPermissions = responseObj.requiredPermissions;
      }
      if (responseObj.conflictField) {
        additionalFields.conflictField = responseObj.conflictField;
      }
      if (responseObj.conflictValue) {
        additionalFields.conflictValue = responseObj.conflictValue;
      }
      if (responseObj.resource) {
        additionalFields.resource = responseObj.resource;
      }
      if (responseObj.resourceId) {
        additionalFields.resourceId = responseObj.resourceId;
      }
    } else {
      message = String(exceptionResponse);
      errorCode = this.mapStatusToErrorCode(status);
    }

    // Log de errores de cliente (4xx) en nivel warn
    if (status >= 400 && status < 500) {
      this.logger.warn(`[${requestId}] Client Error ${status}: ${message}`);
    } else {
      this.logger.error(`[${requestId}] Server Error ${status}: ${message}`);
    }

    const errorResponse: ApiErrorResponse = {
      success: false,
      error: {
        code: errorCode,
        message,
        ...(details !== undefined && { details }),
        ...additionalFields,
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
      },
    };

    response.status(status).json(errorResponse);
  }

  /**
   * Mapea códigos HTTP a códigos de error semánticos
   */
  private mapStatusToErrorCode(status: number, customCode?: string): string {
    if (customCode) {
      return customCode;
    }

    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'BAD_REQUEST';
      case HttpStatus.UNAUTHORIZED:
        return 'UNAUTHORIZED';
      case HttpStatus.FORBIDDEN:
        return 'FORBIDDEN';
      case HttpStatus.NOT_FOUND:
        return 'NOT_FOUND';
      case HttpStatus.CONFLICT:
        return 'CONFLICT';
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return 'UNPROCESSABLE_ENTITY';
      case HttpStatus.TOO_MANY_REQUESTS:
        return 'RATE_LIMIT_EXCEEDED';
      case HttpStatus.SERVICE_UNAVAILABLE:
        return 'SERVICE_UNAVAILABLE';
      case HttpStatus.INTERNAL_SERVER_ERROR:
      default:
        return 'INTERNAL_SERVER_ERROR';
    }
  }
}
