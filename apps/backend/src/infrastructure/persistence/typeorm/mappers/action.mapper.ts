/**
 * Action Mapper
 * Convierte entre la entidad de dominio (Action) y la entidad ORM (ActionOrmEntity)
 * Patrón: Data Mapper
 */

import { Injectable } from '@nestjs/common';
import { Action } from '../../../../domain/entities/action.entity';
import { ActionOrmEntity } from '../entities/action.orm-entity';

@Injectable()
export class ActionMapper {
  /**
   * Convertir de entidad ORM a entidad de dominio
   */
  toDomain(ormEntity: ActionOrmEntity): Action | null {
    if (!ormEntity) {
      return null;
    }

    try {
      return new Action(
        ormEntity.id,
        ormEntity.key,
        ormEntity.name,
        ormEntity.description,
        ormEntity.area,
        ormEntity.createdAt,
        ormEntity.updatedAt,
      );
    } catch (error) {
      console.error(
        `❌ Error mapeando acción ID ${ormEntity.id}: key="${ormEntity.key}", name="${ormEntity.name}"`,
      );
      throw error;
    }
  }

  /**
   * Convertir de entidad de dominio a entidad ORM
   */
  toOrm(domainEntity: Action): ActionOrmEntity | null {
    if (!domainEntity) {
      return null;
    }

    const ormEntity = new ActionOrmEntity();
    ormEntity.id = domainEntity.id;
    ormEntity.key = domainEntity.key;
    ormEntity.name = domainEntity.name;
    ormEntity.description = domainEntity.description;
    ormEntity.area = domainEntity.area;

    if (domainEntity.createdAt) {
      ormEntity.createdAt = domainEntity.createdAt;
    }
    if (domainEntity.updatedAt) {
      ormEntity.updatedAt = domainEntity.updatedAt;
    }

    return ormEntity;
  }

  /**
   * Convertir lista de entidades ORM a lista de entidades de dominio
   */
  toDomainList(ormEntities: ActionOrmEntity[]): Action[] {
    return ormEntities
      .map((entity) => this.toDomain(entity))
      .filter((entity): entity is Action => entity !== null);
  }

  /**
   * Convertir lista de entidades de dominio a lista de entidades ORM
   */
  toOrmList(domainEntities: Action[]): ActionOrmEntity[] {
    return domainEntities
      .map((entity) => this.toOrm(entity))
      .filter((entity): entity is ActionOrmEntity => entity !== null);
  }
}
