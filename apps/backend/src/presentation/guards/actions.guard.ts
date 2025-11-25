import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { AuthorizationService } from '../services/authorization.service';
import { UserOrmEntity } from '../../infrastructure/persistence/typeorm/entities/user.orm-entity';

/**
 * Request type with authenticated user
 */
interface RequestWithUser extends Request {
  user: UserOrmEntity;
}

/**
 * Guard de autorización por acciones
 * Patrón: Guard Pattern (NestJS)
 * Responsabilidad: Verificar que el usuario tenga las acciones requeridas
 */
@Injectable()
export class ActionsGuard implements CanActivate {
  private readonly logger = new Logger(ActionsGuard.name);

  constructor(
    private reflector: Reflector,
    private authorizationService: AuthorizationService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Obtener acciones requeridas del decorator @Actions()
    const requiredActions = this.reflector.getAllAndOverride<string[]>(
      'actions',
      [context.getHandler(), context.getClass()],
    );

    // Si no hay acciones requeridas, permitir acceso
    if (!requiredActions || requiredActions.length === 0) {
      return true;
    }

    // Verificar si la ruta es pública
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // Obtener usuario del request (inyectado por JwtAuthGuard)
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user: UserOrmEntity = request.user;

    if (!user) {
      this.logger.warn('ActionsGuard: No user found in request');
      throw new ForbiddenException('Access denied');
    }

    // Verificar permisos
    const hasPermission = await this.authorizationService.hasAllActions(
      user.id,
      requiredActions,
    );

    if (!hasPermission) {
      this.logger.warn(
        `User ${user.username} (ID: ${user.id}) does not have required actions: ${requiredActions.join(', ')}`,
      );
      throw new ForbiddenException(
        `Insufficient permissions. Required actions: ${requiredActions.join(', ')}`,
      );
    }

    return true;
  }
}
