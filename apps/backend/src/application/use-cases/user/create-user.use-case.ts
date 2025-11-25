/**
 * Create User Use Case
 * Caso de uso para crear un nuevo usuario
 */

import { Injectable, Inject, ConflictException } from '@nestjs/common';
import type { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import type { IHashService } from '../../../domain/services/hash.service.interface';
import { CreateUserDto } from '../../dtos/user/create-user.dto';
import { UserResponseDto } from '../../dtos/user/user-response.dto';
import { User } from '../../../domain/entities/user.entity';
import { Email } from '../../../domain/value-objects/email.vo';

@Injectable()
export class CreateUserUseCase {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('IHashService')
    private readonly hashService: IHashService,
  ) {}

  async execute(dto: CreateUserDto): Promise<UserResponseDto> {
    // Verificar que no exista el username
    const existingByUsername = await this.userRepository.findByUsername(
      dto.username,
    );
    if (existingByUsername) {
      throw new ConflictException(
        `User with username '${dto.username}' already exists`,
      );
    }

    // Crear email value object para búsqueda
    const email = Email.create(dto.email);

    // Verificar que no exista el email
    const existingByEmail = await this.userRepository.findByEmail(email);
    if (existingByEmail) {
      throw new ConflictException(
        `User with email '${dto.email}' already exists`,
      );
    }

    // Hashear la contraseña
    const passwordHash = await this.hashService.hash(dto.password);

    // Crear el usuario
    const user = User.create(dto.username, email, passwordHash, dto.fullName);

    // Guardar
    const savedUser = await this.userRepository.save(user);

    return {
      id: savedUser.id,
      username: savedUser.username,
      email: savedUser.email.value,
      fullName: savedUser.fullName,
      isActive: savedUser.isActive,
      lastLoginAt: savedUser.lastLoginAt,
      failedLoginAttempts: savedUser.failedLoginAttempts,
      lockedUntil: savedUser.lockedUntil,
      groups: [],
      actions: [],
      createdAt: savedUser.createdAt,
      updatedAt: savedUser.updatedAt,
    };
  }
}
