/**
 * RoomMapper
 * Responsabilidad: Mapear entre Room (Domain) y RoomOrmEntity (Infrastructure)
 */

import { Injectable } from '@nestjs/common';
import { Room } from '../../../../domain/entities/room.entity';
import { RoomStatus } from '../../../../domain/enums/room.enums';
import { RoomOrmEntity } from '../entities/room.orm-entity';
import { RoomTypeMapper } from './room-type.mapper';

@Injectable()
export class RoomMapper {
  toDomain(ormEntity: RoomOrmEntity): Room | null {
    if (!ormEntity) {
      return null;
    }

    if (!ormEntity.roomType) {
      throw new Error('RoomType relation must be loaded');
    }

    const roomType = RoomTypeMapper.toDomain(ormEntity.roomType);

    return new Room(
      ormEntity.id,
      ormEntity.numeroHabitacion,
      roomType,
      ormEntity.estado as RoomStatus,
      ormEntity.descripcion,
      ormEntity.caracteristicasAdicionales || [],
      ormEntity.isActive,
      ormEntity.createdAt,
      ormEntity.updatedAt,
    );
  }

  toPersistence(domain: Room): RoomOrmEntity {
    const ormEntity = new RoomOrmEntity();
    ormEntity.id = domain.id;
    ormEntity.numeroHabitacion = domain.numeroHabitacion;
    ormEntity.roomTypeId = domain.roomType.id;
    ormEntity.estado = domain.estado;
    ormEntity.descripcion = domain.descripcion;
    ormEntity.caracteristicasAdicionales = domain.caracteristicasAdicionales;
    ormEntity.isActive = domain.isActive;
    ormEntity.createdAt = domain.createdAt;
    ormEntity.updatedAt = domain.updatedAt;
    return ormEntity;
  }
}
