/**
 * Group Mapper
 * Mapea entre la entidad de dominio Group y la entidad ORM GroupOrmEntity
 */

import { Injectable, Logger } from '@nestjs/common';
import { Group } from '../../../../domain/entities/group.entity';
import { GroupOrmEntity } from '../entities/group.orm-entity';
import { ActionMapper } from './action.mapper';

@Injectable()
export class GroupMapper {
  private readonly logger = new Logger(GroupMapper.name);

  constructor(private readonly actionMapper: ActionMapper) {}

  /**
   * Convierte de entidad ORM a entidad de dominio
   */
  toDomain(ormEntity: GroupOrmEntity): Group | null {
    if (!ormEntity) {
      return null;
    }

    const actions = ormEntity.actions
      ? ormEntity.actions
          .map((a) => {
            const mapped = this.actionMapper.toDomain(a);
            if (!mapped) {
              this.logger.warn(`Action ${a.id} no se pudo mapear en grupo ${ormEntity.key}`);
            }
            return mapped;
          })
          .filter((a): a is NonNullable<typeof a> => a !== null)
      : [];

    const children = ormEntity.children
      ? ormEntity.children
          .map((c) => this.toDomain(c))
          .filter((c): c is NonNullable<typeof c> => c !== null)
      : [];

    return Group.reconstruct(
      ormEntity.id,
      ormEntity.key,
      ormEntity.name,
      ormEntity.description,
      actions,
      children,
      ormEntity.createdAt,
      ormEntity.updatedAt,
    );
  }

  /**
   * Convierte de entidad de dominio a entidad ORM
   */
  toOrm(domain: Group): GroupOrmEntity {
    const ormEntity = new GroupOrmEntity();
    ormEntity.id = domain.id;
    ormEntity.key = domain.key;
    ormEntity.name = domain.name;
    ormEntity.description = domain.description;
    ormEntity.actions = domain.actions
      .map((a) => this.actionMapper.toOrm(a))
      .filter((a): a is NonNullable<typeof a> => a !== null);
    ormEntity.children = domain.children.map((c) => this.toOrm(c));
    ormEntity.createdAt = domain.createdAt;
    ormEntity.updatedAt = domain.updatedAt;

    return ormEntity;
  }
}
