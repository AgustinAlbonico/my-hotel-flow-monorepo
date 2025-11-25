/**
 * ReservationMapper
 * Responsabilidad: Mapear entre Reservation (Domain) y ReservationOrmEntity (Infrastructure)
 */

import { Injectable } from '@nestjs/common';
import {
  Reservation,
  ReservationStatus,
} from '../../../../domain/entities/reservation.entity';
import { ReservationOrmEntity } from '../entities/reservation.orm-entity';
import { CheckInRecord } from '../../../../domain/value-objects/check-in-record.value-object';
import { CheckOutRecord } from '../../../../domain/value-objects/check-out-record.value-object';

@Injectable()
export class ReservationMapper {
  toDomain(ormEntity: ReservationOrmEntity): Reservation | null {
    if (!ormEntity) {
      return null;
    }

    // Mapear checkInData y checkOutData desde JSONB
    let checkInData: CheckInRecord | null = null;
    if (ormEntity.checkInData) {
      checkInData = CheckInRecord.fromJSON(ormEntity.checkInData);
    }

    let checkOutData: CheckOutRecord | null = null;
    if (ormEntity.checkOutData) {
      checkOutData = CheckOutRecord.fromJSON(ormEntity.checkOutData);
    }

    return new Reservation(
      ormEntity.id,
      ormEntity.code,
      ormEntity.clientId,
      ormEntity.roomId,
      ormEntity.checkIn instanceof Date
        ? ormEntity.checkIn
        : new Date(ormEntity.checkIn as unknown as string),
      ormEntity.checkOut instanceof Date
        ? ormEntity.checkOut
        : new Date(ormEntity.checkOut as unknown as string),
      ormEntity.status as ReservationStatus,
      ormEntity.cancelReason,
      ormEntity.createdAt instanceof Date
        ? ormEntity.createdAt
        : new Date(ormEntity.createdAt as unknown as string),
      ormEntity.updatedAt instanceof Date
        ? ormEntity.updatedAt
        : new Date(ormEntity.updatedAt as unknown as string),
      ormEntity.version,
      ormEntity.idempotencyKey,
      checkInData,
      checkOutData,
    );
  }

  toPersistence(domain: Reservation): ReservationOrmEntity {
    const ormEntity = new ReservationOrmEntity();
    ormEntity.id = domain.id;
    ormEntity.code = domain.code;
    ormEntity.clientId = domain.clientId;
    ormEntity.roomId = domain.roomId;
    ormEntity.checkIn = domain.checkIn;
    ormEntity.checkOut = domain.checkOut;
    ormEntity.status = domain.status;
    ormEntity.cancelReason = domain.cancelReason;
    ormEntity.version = domain.version;
    ormEntity.idempotencyKey = domain.idempotencyKey;

    // Mapear value objects a JSONB
    ormEntity.checkInData = domain.checkInData
      ? domain.checkInData.toJSON()
      : null;
    ormEntity.checkOutData = domain.checkOutData
      ? domain.checkOutData.toJSON()
      : null;

    ormEntity.createdAt = domain.createdAt;
    ormEntity.updatedAt = domain.updatedAt;
    return ormEntity;
  }
}
