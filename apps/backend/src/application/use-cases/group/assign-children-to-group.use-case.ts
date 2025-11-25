/**
 * Assign Children to Group Use Case
 * Caso de uso para asignar grupos hijos a un grupo
 */

import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import type { IGroupRepository } from '../../../domain/repositories/group.repository.interface';
import { Group } from '../../../domain/entities/group.entity';
import { AssignChildrenDto } from '../../dtos/group/assign-children.dto';
import { GroupResponseDto } from '../../dtos/group/group-response.dto';

@Injectable()
export class AssignChildrenToGroupUseCase {
  constructor(
    @Inject('IGroupRepository')
    private readonly groupRepository: IGroupRepository,
  ) {}

  async execute(
    groupId: number,
    dto: AssignChildrenDto,
  ): Promise<GroupResponseDto> {
    const group = await this.groupRepository.findByIdWithRelations(
      groupId,
      true,
      true,
    );

    if (!group) {
      throw new NotFoundException(`Group with ID ${groupId} not found`);
    }

    // Buscar todos los grupos hijos
    const children: Group[] = [];
    for (const childId of dto.childrenIds) {
      const child = await this.groupRepository.findByIdWithRelations(
        childId,
        true,
        true,
      );
      if (!child) {
        throw new NotFoundException(`Group with ID ${childId} not found`);
      }
      children.push(child);
    }

    // Intentar asignar hijos (esto validará ciclos)
    try {
      group.assignChildren(children);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Invalid group hierarchy',
      );
    }

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
