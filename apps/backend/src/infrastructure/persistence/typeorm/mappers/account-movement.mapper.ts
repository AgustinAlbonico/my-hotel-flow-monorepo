/**
 * Account Movement Mapper
 */
import { Injectable } from '@nestjs/common';
import {
  AccountMovement,
  MovementType,
  MovementStatus,
} from '../../../../domain/entities/account-movement.entity';
import { AccountMovementOrmEntity } from '../entities/account-movement.orm-entity';

@Injectable()
export class AccountMovementMapper {
  toDomain(orm: AccountMovementOrmEntity): AccountMovement {
    return new AccountMovement(
      orm.id,
      orm.clientId,
      orm.type as MovementType,
      Number(orm.amount),
      Number(orm.balance),
      orm.status as MovementStatus,
      orm.reference,
      orm.description,
      orm.metadata,
      orm.createdAt,
      orm.updatedAt,
    );
  }

  toOrm(domain: AccountMovement): AccountMovementOrmEntity {
    const orm = new AccountMovementOrmEntity();
    if (domain.id) orm.id = domain.id;
    orm.clientId = domain.clientId;
    orm.type = domain.type as any;
    orm.amount = domain.amount;
    orm.balance = domain.balance;
    orm.status = domain.status as any;
    orm.reference = domain.reference;
    orm.description = domain.description;
    orm.metadata = domain.metadata;
    orm.createdAt = domain.createdAt;
    orm.updatedAt = domain.updatedAt;
    return orm;
  }
}
