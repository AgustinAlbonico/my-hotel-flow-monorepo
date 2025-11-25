/**
 * Delete Action Use Case
 * Caso de uso para eliminar una action
 */

import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { IActionRepository } from '../../../domain/repositories/action.repository.interface';

@Injectable()
export class DeleteActionUseCase {
  constructor(
    @Inject('IActionRepository')
    private readonly actionRepository: IActionRepository,
  ) {}

  async execute(id: number): Promise<void> {
    const existing = await this.actionRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Action with id ${id} not found`);
    }

    await this.actionRepository.delete(id);
  }
}
