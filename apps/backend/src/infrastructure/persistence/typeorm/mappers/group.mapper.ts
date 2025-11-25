/**
 * Group Mapper
 * Mapea entre la entidad de dominio Group y la entidad ORM GroupOrmEntity
 */

import { Injectable } from '@nestjs/common';
import { Group } from '../../../../domain/entities/group.entity';
import { GroupOrmEntity } from '../entities/group.orm-entity';
import { ActionMapper } from './action.mapper';

@Injectable()
export class GroupMapper {
  constructor(private readonly actionMapper: ActionMapper) {}

  /**
   * Convierte de entidad ORM a entidad de dominio
   */
  toDomain(ormEntity: GroupOrmEntity): Group | null {
    if (!ormEntity) {
      return null;
    }

    console.log(`     🔄 GroupMapper.toDomain - Grupo: ${ormEntity.key}`);
    console.log(`        Actions ORM: ${ormEntity.actions?.length || 0}`);
    console.log(`        Children ORM: ${ormEntity.children?.length || 0}`);

    const actions = ormEntity.actions
      ? ormEntity.actions
          .map((a) => {
            const mapped = this.actionMapper.toDomain(a);
            if (!mapped) {
              console.log(`        ⚠️  Action ${a.id} no se pudo mapear`);
            }
            return mapped;
          })
          .filter((a): a is NonNullable<typeof a> => a !== null)
      : [];

    console.log(`        Actions mapeadas: ${actions.length}`);

    const children = ormEntity.children
      ? ormEntity.children
          .map((c) => this.toDomain(c))
          .filter((c): c is NonNullable<typeof c> => c !== null)
      : [];

    console.log(`        Children mapeados: ${children.length}`);

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
