/**
 * TypeORM Room Repository Implementation
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { IRoomRepository } from '../../../../domain/repositories/room.repository.interface';
import type { Room } from '../../../../domain/entities/room.entity';
import type { DateRange } from '../../../../domain/value-objects/date-range.value-object';
import { RoomOrmEntity } from '../entities/room.orm-entity';
import { RoomMapper } from '../mappers/room.mapper';

@Injectable()
export class TypeOrmRoomRepository implements IRoomRepository {
  constructor(
    @InjectRepository(RoomOrmEntity)
    private readonly repository: Repository<RoomOrmEntity>,
    private readonly mapper: RoomMapper,
  ) {}

  async findById(id: number): Promise<Room | null> {
    const ormEntity = await this.repository.findOne({
      where: { id },
      relations: ['roomType'],
    });
    return ormEntity ? this.mapper.toDomain(ormEntity) : null;
  }

  async findByNumero(numeroHabitacion: string): Promise<Room | null> {
    const ormEntity = await this.repository.findOne({
      where: { numeroHabitacion },
      relations: ['roomType'],
    });
    return ormEntity ? this.mapper.toDomain(ormEntity) : null;
  }

  async findAllActive(): Promise<Room[]> {
    const ormEntities = await this.repository.find({
      where: { isActive: true },
      relations: ['roomType'],
    });
    console.log('ORM Entities fetched in findAllActive:', ormEntities);
    return ormEntities
      .map((e) => this.mapper.toDomain(e))
      .filter((e): e is NonNullable<typeof e> => e !== null);
  }

  async findAvailableRooms(
    dateRange: DateRange,
    roomTypeCode: string,
    capacity?: number,
  ): Promise<Room[]> {
    const query = this.repository
      .createQueryBuilder('room')
      .leftJoinAndSelect('room.roomType', 'roomType')
      .where('roomType.code = :code', { code: roomTypeCode })
      .andWhere('room.estado = :estado', { estado: 'AVAILABLE' })
      .andWhere('room.isActive = :isActive', { isActive: true });

    if (capacity) {
      query.andWhere('roomType.capacidadMaxima >= :capacity', { capacity });
    }

    // Excluir habitaciones con reservas activas que se superpongan
    query.andWhere((qb) => {
      const subQuery = qb
        .subQuery()
        .select('res.roomId')
        .from('reservations', 'res')
        .where('res.status IN (:...statuses)', {
          statuses: ['CONFIRMED', 'IN_PROGRESS'],
        })
        .andWhere(
          '(:checkIn < res.checkOut AND :checkOut > res.checkIn)',
          {
            checkIn: dateRange.startDate,
            checkOut: dateRange.endDate,
          },
        )
        .getQuery();

      return `room.id NOT IN ${subQuery}`;
    });

    const ormEntities = await query.getMany();
    return ormEntities
      .map((e) => this.mapper.toDomain(e))
      .filter((e): e is NonNullable<typeof e> => e !== null);
  }

  async create(room: Room): Promise<Room> {
    const ormEntity = this.mapper.toPersistence(room);
    const saved = await this.repository.save(ormEntity);
    const reloaded = await this.repository.findOne({
      where: { id: saved.id },
      relations: ['roomType'],
    });
    return this.mapper.toDomain(reloaded!)!;
  }

  async update(room: Room): Promise<Room> {
    const ormEntity = this.mapper.toPersistence(room);
    const saved = await this.repository.save(ormEntity);
    const reloaded = await this.repository.findOne({
      where: { id: saved.id },
      relations: ['roomType'],
    });
    return this.mapper.toDomain(reloaded!)!;
  }

  async isRoomAvailable(
    roomId: number,
    dateRange: DateRange,
  ): Promise<boolean> {
    const count = await this.repository
      .createQueryBuilder('room')
      .leftJoin('reservations', 'res', 'res.roomId = room.id')
      .where('room.id = :roomId', { roomId })
      .andWhere('room.isActive = :isActive', { isActive: true })
      .andWhere('room.estado = :estado', { estado: 'AVAILABLE' })
      .andWhere((qb) => {
        const subQuery = qb
          .subQuery()
          .select('1')
          .from('reservations', 'r')
          .where('r.roomId = :roomId')
          .andWhere('r.status IN (:...statuses)', {
            statuses: ['CONFIRMED', 'IN_PROGRESS'],
          })
          .andWhere(
            '((:checkIn BETWEEN r.checkIn AND r.checkOut) OR (:checkOut BETWEEN r.checkIn AND r.checkOut) OR (r.checkIn BETWEEN :checkIn AND :checkOut))',
            {
              checkIn: dateRange.startDate,
              checkOut: dateRange.endDate,
            },
          )
          .getQuery();

        return `NOT EXISTS ${subQuery}`;
      })
      .getCount();

    return count > 0;
  }
}
