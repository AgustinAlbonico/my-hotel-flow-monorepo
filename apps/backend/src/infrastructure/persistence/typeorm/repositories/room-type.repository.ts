import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoomType } from '../../../../domain/entities/room-type.entity';
import { IRoomTypeRepository } from '../../../../domain/repositories/room-type.repository.interface';
import { RoomTypeOrmEntity } from '../entities/room-type.orm-entity';
import { RoomTypeMapper } from '../mappers/room-type.mapper';

/**
 * TypeOrmRoomTypeRepository
 * Patrón: Repository Pattern - Clean Architecture
 * Capa: Infrastructure
 * Responsabilidad: Implementación concreta del repositorio de tipos de habitación usando TypeORM
 */
@Injectable()
export class TypeOrmRoomTypeRepository implements IRoomTypeRepository {
  constructor(
    @InjectRepository(RoomTypeOrmEntity)
    private readonly roomTypeOrmRepository: Repository<RoomTypeOrmEntity>,
  ) {}

  async findById(id: number): Promise<RoomType | null> {
    const ormEntity = await this.roomTypeOrmRepository.findOne({
      where: { id },
    });

    return ormEntity ? RoomTypeMapper.toDomain(ormEntity) : null;
  }

  async findByCode(code: string): Promise<RoomType | null> {
    const ormEntity = await this.roomTypeOrmRepository.findOne({
      where: { code },
    });

    return ormEntity ? RoomTypeMapper.toDomain(ormEntity) : null;
  }

  async findAllActive(): Promise<RoomType[]> {
    const ormEntities = await this.roomTypeOrmRepository.find({
      where: { isActive: true },
      relations: ['caracteristicas'],
    });

    return RoomTypeMapper.toDomainArray(ormEntities);
  }

  async findAll(): Promise<RoomType[]> {
    const ormEntities = await this.roomTypeOrmRepository.find({
      relations: ['caracteristicas'],
    });
    return RoomTypeMapper.toDomainArray(ormEntities);
  }

  async save(roomType: RoomType): Promise<RoomType> {
    const ormEntity = RoomTypeMapper.toOrm(roomType);
    const savedEntity = await this.roomTypeOrmRepository.save(ormEntity);
    return RoomTypeMapper.toDomain(savedEntity);
  }

  async update(roomType: RoomType): Promise<RoomType> {
    const ormEntity = RoomTypeMapper.toOrm(roomType);
    const updatedEntity = await this.roomTypeOrmRepository.save(ormEntity);
    return RoomTypeMapper.toDomain(updatedEntity);
  }

  async delete(id: number): Promise<void> {
    await this.roomTypeOrmRepository.update(id, {
      isActive: false,
    });
  }

  async existsByCode(code: string): Promise<boolean> {
    const count = await this.roomTypeOrmRepository.count({
      where: { code },
    });
    return count > 0;
  }
}
