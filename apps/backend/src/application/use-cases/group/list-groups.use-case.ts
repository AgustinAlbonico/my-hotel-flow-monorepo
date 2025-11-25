/**
 * List Groups Use Case
 * Caso de uso para listar todos los grupos
 */

import { Injectable, Inject } from '@nestjs/common';
import type { IGroupRepository } from '../../../domain/repositories/group.repository.interface';
import { GroupResponseDto } from '../../dtos/group/group-response.dto';

@Injectable()
export class ListGroupsUseCase {
  constructor(
    @Inject('IGroupRepository')
    private readonly groupRepository: IGroupRepository,
  ) {}

  async execute(): Promise<GroupResponseDto[]> {
    const groups = await this.groupRepository.findAll();

    return groups.map((group) => ({
      id: group.id,
      key: group.key,
      name: group.name,
      description: group.description,
      actions: group.actions.map((action) => ({
        id: action.id,
        key: action.key,
        name: action.name,
        description: action.description,
        module: action.getModule(),
        operation: action.getOperation(),
        createdAt: action.createdAt,
        updatedAt: action.updatedAt,
      })),
      children: group.children.map((child) => ({
        id: child.id,
        key: child.key,
        name: child.name,
        description: child.description,
        actions: [],
        children: [],
        createdAt: child.createdAt,
        updatedAt: child.updatedAt,
      })),
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
    }));
  }
}
