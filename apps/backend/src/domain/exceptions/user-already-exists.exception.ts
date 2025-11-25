import { HttpStatus } from '@nestjs/common';
import { DomainException } from './domain.exception';

/**
 * User Already Exists Exception
 * Se lanza cuando se intenta crear un usuario con username o email duplicado
 */
export class UserAlreadyExistsException extends DomainException {
  constructor(field: 'username' | 'email', value: string) {
    const fieldName = field === 'username' ? 'nombre de usuario' : 'email';
    super(
      `Ya existe un usuario con ${fieldName} '${value}'`,
      HttpStatus.CONFLICT,
      'USER_ALREADY_EXISTS',
      { field, value },
    );
  }
}
