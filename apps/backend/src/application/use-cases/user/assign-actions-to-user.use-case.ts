/**
 * Assign Actions to User Use Case
 * Caso de uso para asignar acciones directas a un usuario
 */

import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import type { IActionRepository } from '../../../domain/repositories/action.repository.interface';
import { Action } from '../../../domain/entities/action.entity';
import { AssignActionsDto } from '../../dtos/user/assign-actions.dto';
import { UserResponseDto } from '../../dtos/user/user-response.dto';

@Injectable()
export class AssignActionsToUserUseCase {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('IActionRepository')
    private readonly actionRepository: IActionRepository,
  ) {}

  async execute(
    userId: number,
    dto: AssignActionsDto,
  ): Promise<UserResponseDto> {
    const user = await this.userRepository.findByIdWithRelations(
      userId,
      true,
      true,
    );

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Buscar todas las acciones (por ID o por key)
    const actions: Action[] = [];

    if (dto.actionIds && dto.actionIds.length > 0) {
      // Buscar por IDs
      for (const actionId of dto.actionIds) {
        const action = await this.actionRepository.findById(actionId);
        if (!action) {
          throw new NotFoundException(`Action with ID ${actionId} not found`);
        }
        actions.push(action);
      }
    } else if (dto.actionKeys && dto.actionKeys.length > 0) {
      // Buscar por keys
      for (const actionKey of dto.actionKeys) {
        const action = await this.actionRepository.findByKey(actionKey);
        if (!action) {
          throw new NotFoundException(
            `Action with key "${actionKey}" not found`,
          );
        }
        actions.push(action);
      }
    }

    // Asignar acciones al usuario
    user.assignActions(actions);

    // Guardar cambios
    const updatedUser = await this.userRepository.save(user);

    return {
      id: updatedUser.id,
      username: updatedUser.username,
      email: updatedUser.email.value,
      fullName: updatedUser.fullName,
      isActive: updatedUser.isActive,
      lastLoginAt: updatedUser.lastLoginAt,
      failedLoginAttempts: updatedUser.failedLoginAttempts,
      lockedUntil: updatedUser.lockedUntil,
      groups: updatedUser.groups.map((group) => ({
        id: group.id,
        key: group.key,
        name: group.name,
        description: group.description,
        actions: [],
        children: [],
        createdAt: group.createdAt,
        updatedAt: group.updatedAt,
      })),
      actions: updatedUser.actions.map((action) => ({
        id: action.id,
        key: action.key,
        name: action.name,
        description: action.description,
        module: action.getModule(),
        operation: action.getOperation(),
        createdAt: action.createdAt,
        updatedAt: action.updatedAt,
      })),
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
    };
  }
}
