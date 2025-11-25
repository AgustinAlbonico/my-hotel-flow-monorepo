/**
 * Create Group Use Case
 * Caso de uso para crear un nuevo grupo
 */

import { Injectable, Inject, ConflictException } from '@nestjs/common';
import type { IGroupRepository } from '../../../domain/repositories/group.repository.interface';
import { CreateGroupDto } from '../../dtos/group/create-group.dto';
import { GroupResponseDto } from '../../dtos/group/group-response.dto';
import { Group } from '../../../domain/entities/group.entity';

@Injectable()
export class CreateGroupUseCase {
  constructor(
    @Inject('IGroupRepository')
    private readonly groupRepository: IGroupRepository,
  ) {}

  async execute(dto: CreateGroupDto): Promise<GroupResponseDto> {
    // Verificar que no exista un grupo con la misma key
    const existingGroup = await this.groupRepository.findByKey(dto.key);
    if (existingGroup) {
      throw new ConflictException(`Group with key '${dto.key}' already exists`);
    }

    // Crear el grupo
    const group = Group.create(dto.key, dto.name, dto.description);

    // Guardar
    const savedGroup = await this.groupRepository.save(group);

    return {
      id: savedGroup.id,
      key: savedGroup.key,
      name: savedGroup.name,
      description: savedGroup.description,
      actions: [],
      children: [],
      createdAt: savedGroup.createdAt,
      updatedAt: savedGroup.updatedAt,
    };
  }
}
