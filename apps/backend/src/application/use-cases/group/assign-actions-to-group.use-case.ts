/**
 * Assign Actions to Group Use Case
 * Caso de uso para asignar acciones a un grupo
 */

import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { IGroupRepository } from '../../../domain/repositories/group.repository.interface';
import type { IActionRepository } from '../../../domain/repositories/action.repository.interface';
import { Action } from '../../../domain/entities/action.entity';
import { AssignActionsDto } from '../../dtos/group/assign-actions.dto';
import { GroupResponseDto } from '../../dtos/group/group-response.dto';

@Injectable()
export class AssignActionsToGroupUseCase {
  constructor(
    @Inject('IGroupRepository')
    private readonly groupRepository: IGroupRepository,
    @Inject('IActionRepository')
    private readonly actionRepository: IActionRepository,
  ) {}

  async execute(
    groupId: number,
    dto: AssignActionsDto,
  ): Promise<GroupResponseDto> {
    const group = await this.groupRepository.findByIdWithRelations(
      groupId,
      true,
      true,
    );

    if (!group) {
      throw new NotFoundException(`Group with ID ${groupId} not found`);
    }

    // Buscar todas las acciones (por ID o por key)
    const actions: Action[] = [];

    if (dto.actionIds && dto.actionIds.length > 0) {
      // Buscar por IDs
      for (const actionId of dto.actionIds) {
        const action = await this.actionRepository.findById(actionId);
        if (!action) {
          throw new NotFoundException(`Action with ID ${actionId} not found`);
        }
        actions.push(action);
      }
    } else if (dto.actionKeys && dto.actionKeys.length > 0) {
      // Buscar por keys
      for (const actionKey of dto.actionKeys) {
        const action = await this.actionRepository.findByKey(actionKey);
        if (!action) {
          throw new NotFoundException(
            `Action with key "${actionKey}" not found`,
          );
        }
        actions.push(action);
      }
    }

    // Asignar acciones al grupo
    group.assignActions(actions);

    // Guardar cambios
    const updatedGroup = await this.groupRepository.save(group);

    return {
      id: updatedGroup.id,
      key: updatedGroup.key,
      name: updatedGroup.name,
      description: updatedGroup.description,
      actions: updatedGroup.actions.map((action) => ({
        id: action.id,
        key: action.key,
        name: action.name,
        description: action.description,
        module: action.getModule(),
        operation: action.getOperation(),
        createdAt: action.createdAt,
        updatedAt: action.updatedAt,
      })),
      children: updatedGroup.children.map((child) => ({
        id: child.id,
        key: child.key,
        name: child.name,
        description: child.description,
        actions: [],
        children: [],
        createdAt: child.createdAt,
        updatedAt: child.updatedAt,
      })),
      createdAt: updatedGroup.createdAt,
      updatedAt: updatedGroup.updatedAt,
    };
  }
}
