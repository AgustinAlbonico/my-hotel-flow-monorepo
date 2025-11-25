/**
 * TypeORM Group Repository Implementation
 * Implementación del repositorio de grupos usando TypeORM
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IGroupRepository } from '../../../../domain/repositories/group.repository.interface';
import { Group } from '../../../../domain/entities/group.entity';
import { GroupOrmEntity } from '../entities/group.orm-entity';
import { GroupMapper } from '../mappers/group.mapper';

@Injectable()
export class TypeOrmGroupRepository implements IGroupRepository {
  constructor(
    @InjectRepository(GroupOrmEntity)
    private readonly repository: Repository<GroupOrmEntity>,
    private readonly mapper: GroupMapper,
  ) {}

  async findAll(): Promise<Group[]> {
    const ormEntities = await this.repository.find({
      relations: ['actions', 'children'],
    });

    return ormEntities
      .map((e) => this.mapper.toDomain(e))
      .filter((e): e is NonNullable<typeof e> => e !== null);
  }

  async findById(id: number): Promise<Group | null> {
    const ormEntity = await this.repository.findOne({
      where: { id },
    });

    if (!ormEntity) {
      return null;
    }

    return this.mapper.toDomain(ormEntity);
  }

  async findByKey(key: string): Promise<Group | null> {
    const ormEntity = await this.repository.findOne({
      where: { key },
    });

    if (!ormEntity) {
      return null;
    }

    return this.mapper.toDomain(ormEntity);
  }

  async findByIdWithRelations(
    id: number,
    includeActions = false,
    includeChildren = false,
  ): Promise<Group | null> {
    const relations: string[] = [];

    if (includeActions) {
      relations.push('actions');
    }

    if (includeChildren) {
      relations.push('children');
      if (includeActions) {
        relations.push('children.actions');
      }
    }

    const ormEntity = await this.repository.findOne({
      where: { id },
      relations,
    });

    if (!ormEntity) {
      return null;
    }

    return this.mapper.toDomain(ormEntity);
  }

  async save(group: Group): Promise<Group> {
    const ormEntity = this.mapper.toOrm(group);
    const savedOrmEntity = await this.repository.save(ormEntity);

    const result = this.mapper.toDomain(savedOrmEntity);
    if (!result) {
      throw new Error('Failed to convert saved ORM entity to domain entity');
    }

    return result;
  }

  async delete(id: number): Promise<void> {
    await this.repository.delete(id);
  }
}
