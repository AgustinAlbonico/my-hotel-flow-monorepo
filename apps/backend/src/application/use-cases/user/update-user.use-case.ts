/**
 * Update User Use Case
 * Caso de uso para actualizar un usuario existente
 */

import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { UpdateUserDto } from '../../dtos/user/update-user.dto';
import { UserResponseDto } from '../../dtos/user/user-response.dto';
import { Email } from '../../../domain/value-objects/email.vo';

@Injectable()
export class UpdateUserUseCase {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(id: number, dto: UpdateUserDto): Promise<UserResponseDto> {
    const user = await this.userRepository.findByIdWithRelations(
      id,
      true,
      true,
    );

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Actualizar email
    if (dto.email !== undefined) {
      const emailVO = Email.create(dto.email);

      // Verificar que el email no esté en uso por otro usuario
      const existingUser = await this.userRepository.findByEmail(emailVO);
      if (existingUser && existingUser.id !== id) {
        throw new Error('Email already in use');
      }

      user.updateEmail(emailVO);
    }

    // Actualizar información
    if (dto.fullName !== undefined) {
      user.updateInfo(dto.fullName);
    }

    // Actualizar estado activo
    if (dto.isActive !== undefined) {
      if (dto.isActive) {
        user.activate();
      } else {
        user.deactivate();
      }
    }

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
