/**
 * TypeORM Account Movement Repository Implementation
 */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IAccountMovementRepository } from '../../../../domain/repositories/account-movement.repository.interface';
import { AccountMovement } from '../../../../domain/entities/account-movement.entity';
import { AccountMovementOrmEntity } from '../entities/account-movement.orm-entity';
import { AccountMovementMapper } from '../mappers/account-movement.mapper';

@Injectable()
export class TypeOrmAccountMovementRepository
  implements IAccountMovementRepository
{
  constructor(
    @InjectRepository(AccountMovementOrmEntity)
    private readonly repository: Repository<AccountMovementOrmEntity>,
    private readonly mapper: AccountMovementMapper,
  ) {}

  async save(movement: AccountMovement): Promise<AccountMovement> {
    const orm = this.mapper.toOrm(movement);
    const saved = await this.repository.save(orm);
    return this.mapper.toDomain(saved);
  }

  async findById(id: number): Promise<AccountMovement | null> {
    const orm = await this.repository.findOne({ where: { id } });
    return orm ? this.mapper.toDomain(orm) : null;
  }

  async findByClientId(clientId: number): Promise<AccountMovement[]> {
    const orms = await this.repository.find({
      where: { clientId },
      order: { createdAt: 'DESC' },
    });
    return orms.map((orm) => this.mapper.toDomain(orm));
  }

  async findByClientIdPaginated(
    clientId: number,
    page: number,
    limit: number,
  ): Promise<{
    movements: AccountMovement[];
    total: number;
    currentBalance: number;
  }> {
    const [orms, total] = await this.repository.findAndCount({
      where: { clientId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const movements = orms.map((orm) => this.mapper.toDomain(orm));

    // Obtener el balance actual (último movimiento)
    const lastMovement = await this.repository.findOne({
      where: { clientId },
      order: { createdAt: 'DESC' },
    });

    const currentBalance = lastMovement ? Number(lastMovement.balance) : 0;

    return {
      movements,
      total,
      currentBalance,
    };
  }

  async getLastBalance(clientId: number): Promise<number> {
    const lastMovement = await this.repository.findOne({
      where: { clientId },
      order: { createdAt: 'DESC' },
    });

    return lastMovement ? Number(lastMovement.balance) : 0;
  }

  async findByReference(reference: string): Promise<AccountMovement[]> {
    const orms = await this.repository.find({
      where: { reference },
      order: { createdAt: 'DESC' },
    });
    return orms.map((orm) => this.mapper.toDomain(orm));
  }
}
