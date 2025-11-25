/**
 * TypeORM Action Repository Implementation
 * Implementación concreta del repositorio de Actions usando TypeORM
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { IActionRepository } from '../../../../domain/repositories/action.repository.interface';
import { Action } from '../../../../domain/entities/action.entity';
import { ActionOrmEntity } from '../entities/action.orm-entity';
import { ActionMapper } from '../mappers/action.mapper';

@Injectable()
export class TypeOrmActionRepository implements IActionRepository {
  constructor(
    @InjectRepository(ActionOrmEntity)
    private readonly ormRepository: Repository<ActionOrmEntity>,
    private readonly mapper: ActionMapper,
  ) {}

  async findAll(): Promise<Action[]> {
    const ormEntities = await this.ormRepository.find({
      order: { key: 'ASC' },
    });
    return this.mapper.toDomainList(ormEntities);
  }

  async findById(id: number): Promise<Action | null> {
    const ormEntity = await this.ormRepository.findOne({ where: { id } });
    return ormEntity ? this.mapper.toDomain(ormEntity) : null;
  }

  async findByKey(key: string): Promise<Action | null> {
    const ormEntity = await this.ormRepository.findOne({ where: { key } });
    return ormEntity ? this.mapper.toDomain(ormEntity) : null;
  }

  async findByKeys(keys: string[]): Promise<Action[]> {
    if (!keys || keys.length === 0) {
      return [];
    }

    const ormEntities = await this.ormRepository.find({
      where: { key: In(keys) },
    });
    return this.mapper.toDomainList(ormEntities);
  }

  async save(action: Action): Promise<Action> {
    const ormEntity = this.mapper.toOrm(action);
    if (!ormEntity) {
      throw new Error('Failed to convert domain entity to ORM entity');
    }

    const saved = await this.ormRepository.save(ormEntity);
    const domainEntity = this.mapper.toDomain(saved);

    if (!domainEntity) {
      throw new Error('Failed to convert saved ORM entity to domain entity');
    }

    return domainEntity;
  }

  async delete(id: number): Promise<void> {
    await this.ormRepository.delete(id);
  }

  async existsByKey(key: string): Promise<boolean> {
    const count = await this.ormRepository.count({ where: { key } });
    return count > 0;
  }
}
