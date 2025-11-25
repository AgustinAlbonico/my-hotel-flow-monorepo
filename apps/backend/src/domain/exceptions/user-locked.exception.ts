import { HttpStatus } from '@nestjs/common';
import { DomainException } from './domain.exception';

/**
 * User Locked Exception
 * Se lanza cuando un usuario intenta iniciar sesión estando bloqueado
 */
export class UserLockedException extends DomainException {
  constructor(
    public readonly lockedUntil: Date,
    public readonly remainingMinutes: number,
  ) {
    super(
      `Usuario bloqueado hasta ${lockedUntil.toLocaleString('es-ES')}. Intenta nuevamente en ${remainingMinutes} minutos.`,
      HttpStatus.FORBIDDEN,
      'ACCOUNT_LOCKED',
      {
        lockedUntil,
        remainingMinutes,
      },
    );
  }
}
