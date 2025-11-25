/**
 * Delete User Use Case
 * Caso de uso para eliminar un usuario
 */

import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { IUserRepository } from '../../../domain/repositories/user.repository.interface';

@Injectable()
export class DeleteUserUseCase {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(id: number): Promise<void> {
    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    await this.userRepository.delete(id);
  }
}
