import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserOrmEntity } from '../../infrastructure/persistence/typeorm/entities/user.orm-entity';
import { Request } from 'express';

/**
 * Request type with authenticated user
 */
interface RequestWithUser extends Request {
  user: UserOrmEntity;
}

/**
 * Decorator para extraer el usuario autenticado del request
 *
 * @example
 * ```typescript
 * @Get('profile')
 * async getProfile(@CurrentUser() user: UserOrmEntity) {
 *   return user;
 * }
 * ```
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): UserOrmEntity => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    return request.user;
  },
);
