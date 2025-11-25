/**
 * Get User By ID Use Case
 * Caso de uso para obtener un usuario por ID
 */

import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { UserResponseDto } from '../../dtos/user/user-response.dto';

@Injectable()
export class GetUserByIdUseCase {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(id: number): Promise<UserResponseDto> {
    const user = await this.userRepository.findByIdWithRelations(
      id,
      true,
      true,
    );

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email.value,
      fullName: user.fullName,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
      failedLoginAttempts: user.failedLoginAttempts,
      lockedUntil: user.lockedUntil,
      groups: user.groups.map((group) => ({
        id: group.id,
        key: group.key,
        name: group.name,
        description: group.description,
        actions: [],
        children: [],
        createdAt: group.createdAt,
        updatedAt: group.updatedAt,
      })),
      actions: user.actions.map((action) => ({
        id: action.id,
        key: action.key,
        name: action.name,
        description: action.description,
        module: action.getModule(),
        operation: action.getOperation(),
        createdAt: action.createdAt,
        updatedAt: action.updatedAt,
      })),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
