import { HttpStatus } from '@nestjs/common';
import { DomainException } from './domain.exception';

/**
 * User Not Active Exception
 * Se lanza cuando se intenta realizar una operación con un usuario inactivo
 */
export class UserNotActiveException extends DomainException {
  constructor(username: string) {
    super(
      `El usuario '${username}' no está activo`,
      HttpStatus.FORBIDDEN,
      'USER_NOT_ACTIVE',
    );
  }
}
