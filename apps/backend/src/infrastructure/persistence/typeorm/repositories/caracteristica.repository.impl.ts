import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Caracteristica } from '../../../../domain/entities/caracteristica.entity';
import { ICaracteristicaRepository } from '../../../../domain/repositories/caracteristica.repository.interface';
import { CaracteristicaOrmEntity } from '../entities/caracteristica.orm-entity';
import { CaracteristicaMapper } from '../mappers/caracteristica.mapper';

/**
 * CaracteristicaRepository
 * Patrón: Repository Implementation - Clean Architecture
 * Capa: Infrastructure
 * Responsabilidad: Implementar persistencia de características usando TypeORM
 */
@Injectable()
export class CaracteristicaRepository implements ICaracteristicaRepository {
  constructor(
    @InjectRepository(CaracteristicaOrmEntity)
    private readonly repository: Repository<CaracteristicaOrmEntity>,
  ) {}

  async findById(id: number): Promise<Caracteristica | null> {
    const ormEntity = await this.repository.findOne({ where: { id } });
    return ormEntity ? CaracteristicaMapper.toDomain(ormEntity) : null;
  }

  async findByNombre(nombre: string): Promise<Caracteristica | null> {
    const ormEntity = await this.repository.findOne({ where: { nombre } });
    return ormEntity ? CaracteristicaMapper.toDomain(ormEntity) : null;
  }

  async findAll(): Promise<Caracteristica[]> {
    const ormEntities = await this.repository.find({
      order: { nombre: 'ASC' },
    });
    return CaracteristicaMapper.toDomainList(ormEntities);
  }

  async findAllActive(): Promise<Caracteristica[]> {
    const ormEntities = await this.repository.find({
      where: { isActive: true },
      order: { nombre: 'ASC' },
    });
    return CaracteristicaMapper.toDomainList(ormEntities);
  }

  async save(caracteristica: Caracteristica): Promise<Caracteristica> {
    const ormEntity = CaracteristicaMapper.toOrm(caracteristica);
    const savedEntity = await this.repository.save(ormEntity);
    return CaracteristicaMapper.toDomain(savedEntity);
  }

  async update(caracteristica: Caracteristica): Promise<Caracteristica> {
    const ormEntity = CaracteristicaMapper.toOrm(caracteristica);
    await this.repository.update(caracteristica.id, ormEntity);
    const updatedEntity = await this.repository.findOne({
      where: { id: caracteristica.id },
    });
    if (!updatedEntity) {
      throw new Error('Característica no encontrada después de actualizar');
    }
    return CaracteristicaMapper.toDomain(updatedEntity);
  }

  async delete(id: number): Promise<void> {
    await this.repository.softDelete(id);
  }

  async existsByNombre(nombre: string): Promise<boolean> {
    const count = await this.repository.count({ where: { nombre } });
    return count > 0;
  }

  async findByIds(ids: number[]): Promise<Caracteristica[]> {
    const ormEntities = await this.repository.findByIds(ids);
    return CaracteristicaMapper.toDomainList(ormEntities);
  }
}
