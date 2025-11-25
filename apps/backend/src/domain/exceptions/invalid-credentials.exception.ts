import { HttpStatus } from '@nestjs/common';
import { DomainException } from './domain.exception';

/**
 * Invalid Credentials Exception
 * Se lanza cuando las credenciales de login son incorrectas
 */
export class InvalidCredentialsException extends DomainException {
  constructor(message = 'Usuario o contraseña incorrectos') {
    super(message, HttpStatus.UNAUTHORIZED, 'INVALID_CREDENTIALS');
  }
}
