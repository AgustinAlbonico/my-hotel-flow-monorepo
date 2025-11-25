/**
 * Get Action By ID Use Case
 * Caso de uso para obtener una action por su ID
 */

import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { IActionRepository } from '../../../domain/repositories/action.repository.interface';
import { ActionResponseDto } from '../../dtos/action/action-response.dto';

@Injectable()
export class GetActionByIdUseCase {
  constructor(
    @Inject('IActionRepository')
    private readonly actionRepository: IActionRepository,
  ) {}

  async execute(id: number): Promise<ActionResponseDto> {
    const action = await this.actionRepository.findById(id);

    if (!action) {
      throw new NotFoundException(`Action with id ${id} not found`);
    }

    return {
      id: action.id,
      key: action.key,
      name: action.name,
      description: action.description,
      area: action.area,
      module: action.getModule(),
      operation: action.getOperation(),
      createdAt: action.createdAt,
      updatedAt: action.updatedAt,
    };
  }
}
