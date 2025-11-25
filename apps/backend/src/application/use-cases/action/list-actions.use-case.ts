/**
 * List Actions Use Case
 * Caso de uso para listar todas las actions
 */

import { Injectable, Inject } from '@nestjs/common';
import type { IActionRepository } from '../../../domain/repositories/action.repository.interface';
import { ActionResponseDto } from '../../dtos/action/action-response.dto';

@Injectable()
export class ListActionsUseCase {
  constructor(
    @Inject('IActionRepository')
    private readonly actionRepository: IActionRepository,
  ) {}

  async execute(): Promise<ActionResponseDto[]> {
    const actions = await this.actionRepository.findAll();

    return actions.map((action) => ({
      id: action.id,
      key: action.key,
      name: action.name,
      description: action.description,
      area: action.area,
      module: action.getModule(),
      operation: action.getOperation(),
      createdAt: action.createdAt,
      updatedAt: action.updatedAt,
    }));
  }
}
