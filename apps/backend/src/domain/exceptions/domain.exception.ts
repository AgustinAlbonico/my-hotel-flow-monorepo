import { HttpStatus } from '@nestjs/common';

/**
 * Base Domain Exception
 *
 * Clase base para todas las excepciones de dominio de la aplicación.
 * Proporciona información estructurada sobre el error incluyendo:
 * - Código HTTP apropiado
 * - Código de error semántico
 * - Mensaje descriptivo
 * - Metadata adicional opcional
 *
 * Usar esta clase base garantiza que todas las excepciones de dominio
 * sean manejadas consistentemente por el DomainExceptionFilter.
 */
export abstract class DomainException extends Error {
  /**
   * Código HTTP a devolver (401, 403, 409, etc.)
   */
  public readonly httpStatus: HttpStatus;

  /**
   * Código de error semántico (INVALID_CREDENTIALS, ACCOUNT_LOCKED, etc.)
   */
  public readonly errorCode: string;

  /**
   * Metadata adicional del error (opcional)
   */
  public readonly metadata?: Record<string, unknown>;

  protected constructor(
    message: string,
    httpStatus: HttpStatus,
    errorCode: string,
    metadata?: Record<string, unknown>,
  ) {
    super(message);
    this.name = this.constructor.name;
    this.httpStatus = httpStatus;
    this.errorCode = errorCode;
    this.metadata = metadata;

    // Mantener el stack trace correcto en V8
    Error.captureStackTrace(this, this.constructor);
  }
}
