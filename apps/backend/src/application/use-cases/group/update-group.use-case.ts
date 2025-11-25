/**
 * Update Group Use Case
 * Caso de uso para actualizar un grupo existente
 */

import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { IGroupRepository } from '../../../domain/repositories/group.repository.interface';
import { UpdateGroupDto } from '../../dtos/group/update-group.dto';
import { GroupResponseDto } from '../../dtos/group/group-response.dto';

@Injectable()
export class UpdateGroupUseCase {
  constructor(
    @Inject('IGroupRepository')
    private readonly groupRepository: IGroupRepository,
  ) {}

  async execute(id: number, dto: UpdateGroupDto): Promise<GroupResponseDto> {
    const group = await this.groupRepository.findByIdWithRelations(
      id,
      true,
      true,
    );

    if (!group) {
      throw new NotFoundException(`Group with ID ${id} not found`);
    }

    // Actualizar información
    if (dto.name || dto.description !== undefined) {
      group.updateInfo(dto.name || group.name, dto.description);
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
