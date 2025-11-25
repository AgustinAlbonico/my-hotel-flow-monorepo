/**
 * User Mapper
 * Mapea entre la entidad de dominio User y la entidad ORM UserOrmEntity
 */

import { Injectable } from '@nestjs/common';
import { User } from '../../../../domain/entities/user.entity';
import { Email } from '../../../../domain/value-objects/email.vo';
import { UserOrmEntity } from '../entities/user.orm-entity';
import { GroupMapper } from './group.mapper';
import { ActionMapper } from './action.mapper';

@Injectable()
export class UserMapper {
  constructor(
    private readonly groupMapper: GroupMapper,
    private readonly actionMapper: ActionMapper,
  ) {}

  /**
   * Convierte de entidad ORM a entidad de dominio
   */
  toDomain(ormEntity: UserOrmEntity): User | null {
    if (!ormEntity) {
      return null;
    }

    console.log(
      '🔄 UserMapper.toDomain - Mapeando usuario:',
      ormEntity.username,
    );
    console.log(`   Groups ORM: ${ormEntity.groups?.length || 0}`);
    console.log(`   Actions ORM: ${ormEntity.actions?.length || 0}`);

    const email = Email.create(ormEntity.email);

    const groups = ormEntity.groups
      ? ormEntity.groups
          .map((g) => {
            console.log(
              `   → Mapeando grupo: ${g.key} (${g.actions?.length || 0} actions)`,
            );
            return this.groupMapper.toDomain(g);
          })
          .filter((g): g is NonNullable<typeof g> => g !== null)
      : [];

    console.log(`   Groups mapeados: ${groups.length}`);

    const actions = ormEntity.actions
      ? ormEntity.actions
          .map((a) => this.actionMapper.toDomain(a))
          .filter((a): a is NonNullable<typeof a> => a !== null)
      : [];

    console.log(`   Actions mapeadas: ${actions.length}`);
    console.log(`   ✅ User mapeado completamente\n`);

    return User.reconstruct(
      ormEntity.id,
      ormEntity.username,
      email,
      ormEntity.passwordHash,
      ormEntity.fullName,
      ormEntity.isActive,
      ormEntity.lastLoginAt,
      ormEntity.failedLoginAttempts,
      ormEntity.lockedUntil,
      groups,
      actions,
      ormEntity.passwordResetToken,
      ormEntity.passwordResetExpires,
      ormEntity.createdAt,
      ormEntity.updatedAt,
    );
  }

  /**
   * Convierte de entidad de dominio a entidad ORM
   */
  toOrm(domain: User): UserOrmEntity {
    const ormEntity = new UserOrmEntity();
    ormEntity.id = domain.id;
    ormEntity.username = domain.username;
    ormEntity.email = domain.email.value;
    ormEntity.passwordHash = domain.passwordHash;
    ormEntity.fullName = domain.fullName;
    ormEntity.isActive = domain.isActive;
    ormEntity.lastLoginAt = domain.lastLoginAt;
    ormEntity.failedLoginAttempts = domain.failedLoginAttempts;
    ormEntity.lockedUntil = domain.lockedUntil;
    ormEntity.groups = domain.groups.map((g) => this.groupMapper.toOrm(g));
    ormEntity.actions = domain.actions
      .map((a) => this.actionMapper.toOrm(a))
      .filter((a): a is NonNullable<typeof a> => a !== null);
    ormEntity.passwordResetToken = domain.passwordResetToken;
    ormEntity.passwordResetExpires = domain.passwordResetExpires;
    ormEntity.createdAt = domain.createdAt;
    ormEntity.updatedAt = domain.updatedAt;

    return ormEntity;
  }
}
