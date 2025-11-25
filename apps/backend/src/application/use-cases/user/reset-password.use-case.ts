/**
 * Reset Password Use Case
 * Caso de uso para resetear la contraseña de un usuario (admin action)
 */

import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import type { IHashService } from '../../../domain/services/hash.service.interface';
import { ResetPasswordDto } from '../../dtos/user/reset-password.dto';
import { UserResponseDto } from '../../dtos/user/user-response.dto';

@Injectable()
export class ResetPasswordUseCase {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('IHashService')
    private readonly hashService: IHashService,
  ) {}

  async execute(
    userId: number,
    dto: ResetPasswordDto,
  ): Promise<UserResponseDto> {
    const user = await this.userRepository.findByIdWithRelations(
      userId,
      true,
      true,
    );

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Hashear la nueva contraseña
    const newPasswordHash = await this.hashService.hash(dto.newPassword);

    // Actualizar el hash de la contraseña
    user.updatePasswordHash(newPasswordHash);

    // Desbloquear la cuenta si estaba bloqueada
    if (user.isLocked()) {
      user.unlock();
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
