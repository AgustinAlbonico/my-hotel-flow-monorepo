/**
 * Delete Group Use Case
 * Caso de uso para eliminar un grupo
 */

import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { IGroupRepository } from '../../../domain/repositories/group.repository.interface';

@Injectable()
export class DeleteGroupUseCase {
  constructor(
    @Inject('IGroupRepository')
    private readonly groupRepository: IGroupRepository,
  ) {}

  async execute(id: number): Promise<void> {
    const group = await this.groupRepository.findById(id);

    if (!group) {
      throw new NotFoundException(`Group with ID ${id} not found`);
    }

    await this.groupRepository.delete(id);
  }
}
