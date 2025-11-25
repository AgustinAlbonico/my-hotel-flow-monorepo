import { Injectable } from '@nestjs/common';
import { GetInheritedActionsUseCase } from '../../application/use-cases/user/get-inherited-actions.use-case';

/**
 * Authorization Service for Guards
 *
 * Servicio de autorización que utiliza use cases de Clean Architecture
 * para verificar permisos de usuarios.
 */
@Injectable()
export class AuthorizationService {
  constructor(
    private readonly getInheritedActionsUseCase: GetInheritedActionsUseCase,
  ) {}

  /**
   * Verifica si un usuario tiene todas las acciones requeridas
   *
   * @param userId - ID del usuario
   * @param requiredActions - Lista de action keys requeridas
   * @returns true si el usuario tiene todas las acciones, false en caso contrario
   */
  async hasAllActions(
    userId: number,
    requiredActions: string[],
  ): Promise<boolean> {
    if (!requiredActions || requiredActions.length === 0) {
      return true;
    }

    try {
      // Obtener acciones heredadas del usuario (directas + de grupos)
      const userActions = await this.getInheritedActionsUseCase.execute(userId);

      // Extraer las keys de las acciones
      const userActionKeys = new Set(userActions.map((action) => action.key));

      // Verificar si el usuario tiene todas las acciones requeridas
      return requiredActions.every((requiredAction) =>
        userActionKeys.has(requiredAction),
      );
    } catch (error) {
      // Si hay error al obtener acciones, denegar acceso
      return false;
    }
  }

  /**
   * Verifica si un usuario tiene al menos una de las acciones requeridas
   *
   * @param userId - ID del usuario
   * @param requiredActions - Lista de action keys requeridas
   * @returns true si el usuario tiene al menos una acción, false en caso contrario
   */
  async hasAnyAction(
    userId: number,
    requiredActions: string[],
  ): Promise<boolean> {
    if (!requiredActions || requiredActions.length === 0) {
      return true;
    }

    try {
      const userActions = await this.getInheritedActionsUseCase.execute(userId);

      const userActionKeys = new Set(userActions.map((action) => action.key));

      return requiredActions.some((requiredAction) =>
        userActionKeys.has(requiredAction),
      );
    } catch (error) {
      return false;
    }
  }
}
