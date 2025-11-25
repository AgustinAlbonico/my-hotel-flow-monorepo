/**
 * Get Inherited Actions Use Case
 * Caso de uso para obtener todas las acciones heredadas de un usuario
 * (acciones directas + acciones de grupos)
 */

import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { ActionResponseDto } from '../../dtos/action/action-response.dto';

@Injectable()
export class GetInheritedActionsUseCase {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(userId: number): Promise<ActionResponseDto[]> {
    const user = await this.userRepository.findByIdWithRelations(
      userId,
      true,
      true,
    );

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const inheritedActions = user.getInheritedActions();

    return inheritedActions.map((action) => ({
      id: action.id,
      key: action.key,
      name: action.name,
      description: action.description,
      module: action.getModule(),
      operation: action.getOperation(),
      createdAt: action.createdAt,
      updatedAt: action.updatedAt,
    }));
  }
}
