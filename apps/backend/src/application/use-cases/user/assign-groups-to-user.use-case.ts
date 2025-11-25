/**
 * Assign Groups to User Use Case
 * Caso de uso para asignar grupos a un usuario
 */

import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import type { IGroupRepository } from '../../../domain/repositories/group.repository.interface';
import { Group } from '../../../domain/entities/group.entity';
import { AssignGroupsDto } from '../../dtos/user/assign-groups.dto';
import { UserResponseDto } from '../../dtos/user/user-response.dto';

@Injectable()
export class AssignGroupsToUserUseCase {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('IGroupRepository')
    private readonly groupRepository: IGroupRepository,
  ) {}

  async execute(
    userId: number,
    dto: AssignGroupsDto,
  ): Promise<UserResponseDto> {
    const user = await this.userRepository.findByIdWithRelations(
      userId,
      true,
      true,
    );

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Buscar todos los grupos
    const groups: Group[] = [];
    for (const groupId of dto.groupIds) {
      const group = await this.groupRepository.findByIdWithRelations(
        groupId,
        true,
        true,
      );
      if (!group) {
        throw new NotFoundException(`Group with ID ${groupId} not found`);
      }
      groups.push(group);
    }

    // Asignar grupos al usuario
    user.assignGroups(groups);

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
