/**
 * Get Effective Actions Use Case
 * Caso de uso para obtener las acciones efectivas de un grupo
 * (acciones propias + heredadas de grupos hijos)
 */

import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { IGroupRepository } from '../../../domain/repositories/group.repository.interface';
import { ActionResponseDto } from '../../dtos/action/action-response.dto';

@Injectable()
export class GetEffectiveActionsUseCase {
  constructor(
    @Inject('IGroupRepository')
    private readonly groupRepository: IGroupRepository,
  ) {}

  async execute(groupId: number): Promise<ActionResponseDto[]> {
    const group = await this.groupRepository.findByIdWithRelations(
      groupId,
      true,
      true,
    );

    if (!group) {
      throw new NotFoundException(`Group with ID ${groupId} not found`);
    }

    const effectiveActions = group.getEffectiveActions();

    return effectiveActions.map((action) => ({
      id: action.id,
      key: action.key,
      name: action.name,
      description: action.description,
      module: action.getModule(),
      operation: action.getOperation(),
      createdAt: action.createdAt,
      updatedAt: action.updatedAt,
    }));
  }
}
