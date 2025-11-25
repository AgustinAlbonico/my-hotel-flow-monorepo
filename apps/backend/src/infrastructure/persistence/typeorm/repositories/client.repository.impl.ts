/**
 * TypeORM Client Repository Implementation
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IClientRepository } from '../../../../domain/repositories/client.repository.interface';
import { Client } from '../../../../domain/entities/client.entity';
import { DNI } from '../../../../domain/value-objects/dni.value-object';
import { Email } from '../../../../domain/value-objects/email.value-object';
import { ClientOrmEntity } from '../entities/client.orm-entity';
import { ClientMapper } from '../mappers/client.mapper';

@Injectable()
export class TypeOrmClientRepository implements IClientRepository {
  constructor(
    @InjectRepository(ClientOrmEntity)
    private readonly repository: Repository<ClientOrmEntity>,
    private readonly mapper: ClientMapper,
  ) {}

  async findByDNI(dni: DNI): Promise<Client | null> {
    const ormEntity = await this.repository.findOne({
      where: { dni: dni.value, isActive: true },
    });
    if (!ormEntity) return null;
    return this.mapper.toDomain(ormEntity);
  }

  async findByDni(dni: string): Promise<Client | null> {
    const ormEntity = await this.repository.findOne({
      where: { dni, isActive: true },
    });
    if (!ormEntity) return null;
    return this.mapper.toDomain(ormEntity);
  }

  async findByEmail(email: Email): Promise<Client | null> {
    const ormEntity = await this.repository.findOne({
      where: { email: email.value, isActive: true },
    });
    if (!ormEntity) return null;
    return this.mapper.toDomain(ormEntity);
  }

  async findById(id: number): Promise<Client | null> {
    const ormEntity = await this.repository.findOne({
      where: { id, isActive: true },
    });
    if (!ormEntity) return null;
    return this.mapper.toDomain(ormEntity);
  }

  async save(client: Client): Promise<Client> {
    const ormEntity = this.mapper.toOrm(client);
    const saved = await this.repository.save(ormEntity);
    return this.mapper.toDomain(saved);
  }

  async update(client: Client): Promise<Client> {
    const ormEntity = this.mapper.toOrm(client);
    const updated = await this.repository.save(ormEntity);
    return this.mapper.toDomain(updated);
  }

  async delete(id: number): Promise<void> {
    // Soft delete - marcar como inactivo en lugar de eliminar
    await this.repository.update(id, { isActive: false });
  }

  async findAll(): Promise<Client[]> {
    const ormEntities = await this.repository.find({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
    });
    return ormEntities.map((e) => this.mapper.toDomain(e));
  }
}
