/**
 * TypeORM User Repository Implementation
 * Implementación del repositorio de usuarios usando TypeORM
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { IUserRepository } from '../../../../domain/repositories/user.repository.interface';
import type { User } from '../../../../domain/entities/user.entity';
import type { Email } from '../../../../domain/value-objects/email.vo';
import { UserOrmEntity } from '../entities/user.orm-entity';
import { UserMapper } from '../mappers/user.mapper';

@Injectable()
export class TypeOrmUserRepository implements IUserRepository {
  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly repository: Repository<UserOrmEntity>,
    private readonly mapper: UserMapper,
  ) {}

  async findAll(): Promise<User[]> {
    const ormEntities = await this.repository.find({
      relations: ['groups', 'actions'],
    });

    return ormEntities
      .map((e) => this.mapper.toDomain(e))
      .filter((e): e is NonNullable<typeof e> => e !== null);
  }

  async findById(id: number): Promise<User | null> {
    const ormEntity = await this.repository.findOne({
      where: { id },
    });

    if (!ormEntity) {
      return null;
    }

    return this.mapper.toDomain(ormEntity);
  }

  async findByUsername(username: string): Promise<User | null> {
    const ormEntity = await this.repository.findOne({
      where: { username },
    });

    if (!ormEntity) {
      return null;
    }

    return this.mapper.toDomain(ormEntity);
  }

  async findByEmail(email: Email): Promise<User | null> {
    const ormEntity = await this.repository.findOne({
      where: { email: email.value }, // Email VO ya normaliza a lowercase
    });

    if (!ormEntity) {
      return null;
    }

    return this.mapper.toDomain(ormEntity);
  }

  async findByPasswordResetToken(token: string): Promise<User | null> {
    const ormEntity = await this.repository.findOne({
      where: { passwordResetToken: token },
    });

    if (!ormEntity) {
      return null;
    }

    return this.mapper.toDomain(ormEntity);
  }

  async findByIdWithRelations(
    id: number,
    includeGroups = false,
    includeActions = false,
  ): Promise<User | null> {
    const relations: string[] = [];

    if (includeGroups) {
      relations.push('groups');
      relations.push('groups.actions');
      // NOTA: Por ahora los grupos son planos (sin children), pero la estructura
      // de dominio soporta recursión para el futuro
      // relations.push('groups.children');
      // relations.push('groups.children.actions');
    }

    if (includeActions) {
      relations.push('actions');
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

  async findByUsernameWithRelations(
    username: string,
    includeGroups = false,
    includeActions = false,
  ): Promise<User | null> {
    const relations: string[] = [];

    if (includeGroups) {
      relations.push('groups');
      relations.push('groups.actions');
      // NOTA: Por ahora los grupos son planos (sin children)
      // relations.push('groups.children');
      // relations.push('groups.children.actions');
    }

    if (includeActions) {
      relations.push('actions');
    }

    const ormEntity = await this.repository.findOne({
      where: { username },
      relations,
    });

    if (!ormEntity) {
      return null;
    }

    return this.mapper.toDomain(ormEntity);
  }

  async save(user: User): Promise<User> {
    const ormEntity = this.mapper.toOrm(user);
    const savedOrmEntity = await this.repository.save(ormEntity);

    const result = this.mapper.toDomain(savedOrmEntity);
    if (!result) {
      throw new Error('Failed to convert saved ORM entity to domain entity');
    }

    return result;
  }

  /**
   * Actualiza solo los campos relacionados con login sin tocar relaciones
   * Esto evita que se borren groups/actions cuando se guarda después del login
   */
  async updateLoginInfo(
    userId: number,
    lastLoginAt: Date | undefined,
    failedLoginAttempts: number,
    lockedUntil: Date | undefined,
  ): Promise<void> {
    await this.repository.update(userId, {
      lastLoginAt,
      failedLoginAttempts,
      lockedUntil,
      updatedAt: new Date(),
    });
  }

  async delete(id: number): Promise<void> {
    await this.repository.delete(id);
  }
}
