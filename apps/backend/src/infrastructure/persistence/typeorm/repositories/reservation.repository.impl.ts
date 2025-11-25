/**
 * TypeORM Reservation Repository Implementation
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  EntityManager,
  In,
  LessThanOrEqual,
  MoreThanOrEqual,
} from 'typeorm';
import type {
  IReservationRepository,
  ReservationListItemView,
} from '../../../../domain/repositories/reservation.repository.interface';
import { Reservation, ReservationStatus } from '../../../../domain/entities/reservation.entity';
import { ReservationOrmEntity } from '../entities/reservation.orm-entity';
import { ReservationMapper } from '../mappers/reservation.mapper';

@Injectable()
export class TypeOrmReservationRepository implements IReservationRepository {
  constructor(
    @InjectRepository(ReservationOrmEntity)
    private readonly repository: Repository<ReservationOrmEntity>,
    private readonly mapper: ReservationMapper,
  ) {}

  async findById(id: number): Promise<Reservation | null> {
    const ormEntity = await this.repository.findOne({ where: { id } });
    return ormEntity ? this.mapper.toDomain(ormEntity) : null;
  }

  async findByCode(code: string): Promise<Reservation | null> {
    const ormEntity = await this.repository.findOne({ where: { code } });
    return ormEntity ? this.mapper.toDomain(ormEntity) : null;
  }

  async findByClientDni(dni: string): Promise<Reservation | null> {
    const ormEntity = await this.repository
      .createQueryBuilder('reservation')
      .innerJoinAndSelect('reservation.client', 'client')
      .where('client.dni = :dni', { dni })
      .andWhere('reservation.status = :status', { status: 'CONFIRMED' })
      .orderBy('reservation.createdAt', 'DESC')
      .getOne();

    return ormEntity ? this.mapper.toDomain(ormEntity) : null;
  }

  async save(reservation: Reservation): Promise<Reservation> {
    const ormEntity = this.mapper.toPersistence(reservation);
    const saved = await this.repository.save(ormEntity);
    return this.mapper.toDomain(saved)!;
  }

  async update(reservation: Reservation): Promise<Reservation> {
    const ormEntity = this.mapper.toPersistence(reservation);
    const saved = await this.repository.save(ormEntity);
    return this.mapper.toDomain(saved)!;
  }

  async findOverlappingReservations(
    roomId: number,
    checkIn: Date,
    checkOut: Date,
    excludeReservationId?: number,
  ): Promise<Reservation[]> {
    const queryBuilder = this.repository
      .createQueryBuilder('reservation')
      .where('reservation.roomId = :roomId', { roomId })
      .andWhere('reservation.status IN (:...statuses)', {
        statuses: ['CONFIRMED', 'IN_PROGRESS'],
      })
      .andWhere(
        '(reservation.checkIn < :checkOut AND reservation.checkOut > :checkIn)',
        { checkIn, checkOut },
      );

    if (excludeReservationId) {
      queryBuilder.andWhere('reservation.id != :excludeReservationId', {
        excludeReservationId,
      });
    }

    const ormEntities = await queryBuilder.getMany();
    return ormEntities.map((entity) => this.mapper.toDomain(entity)!);
  }

  async findByIdempotencyKey(key: string): Promise<Reservation | null> {
    const ormEntity = await this.repository.findOne({
      where: { idempotencyKey: key },
    });
    return ormEntity ? this.mapper.toDomain(ormEntity) : null;
  }

  async countPendingByClient(clientId: number): Promise<number> {
    return this.repository.count({
      where: {
        clientId,
        status: In(['CONFIRMED', 'IN_PROGRESS']),
      },
    });
  }

  async hasActiveReservationByClient(clientId: number): Promise<boolean> {
    const count = await this.repository.count({
      where: {
        clientId,
        status: In(['CONFIRMED', 'IN_PROGRESS']),
      },
    });
    return count > 0;
  }

  async findWithLock(
    id: number,
    transactionManager?: EntityManager,
  ): Promise<Reservation | null> {
    const manager = transactionManager || this.repository.manager;

    const ormEntity = await manager
      .getRepository(ReservationOrmEntity)
      .createQueryBuilder('reservation')
      .where('reservation.id = :id', { id })
      .setLock('pessimistic_write')
      .getOne();

    return ormEntity ? this.mapper.toDomain(ormEntity) : null;
  }

  async findAll(filters: {
    status?: ReservationStatus;
    checkInFrom?: Date;
    checkInTo?: Date;
    clientId?: number;
    roomId?: number;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: ReservationListItemView[]; total: number }> {
    const {
      status,
      checkInFrom,
      checkInTo,
      clientId,
      roomId,
      search,
      page = 1,
      limit = 20,
    } = filters;

    const queryBuilder = this.repository
      .createQueryBuilder('reservation')
      .leftJoinAndSelect('reservation.client', 'client')
      .leftJoinAndSelect('reservation.room', 'room');

    if (status) {
      queryBuilder.andWhere('reservation.status = :status', { status });
    }

    if (checkInFrom && checkInTo) {
      // Comparar siempre por la FECHA de check-in, no por timestamp completo
      const fromStr = checkInFrom.toISOString().split('T')[0];
      const toStr = checkInTo.toISOString().split('T')[0];

      if (fromStr === toStr) {
        // Día exacto
        queryBuilder.andWhere('DATE(reservation.checkIn) = :checkInDate', {
          checkInDate: fromStr,
        });
      } else {
        // Rango de fechas inclusivo por día de check-in
        queryBuilder.andWhere(
          'DATE(reservation.checkIn) BETWEEN :checkInFrom AND :checkInTo',
          {
            checkInFrom: fromStr,
            checkInTo: toStr,
          },
        );
      }
    } else if (checkInFrom) {
      const fromStr = checkInFrom.toISOString().split('T')[0];
      queryBuilder.andWhere('DATE(reservation.checkIn) >= :checkInFrom', {
        checkInFrom: fromStr,
      });
    } else if (checkInTo) {
      const toStr = checkInTo.toISOString().split('T')[0];
      queryBuilder.andWhere('DATE(reservation.checkIn) <= :checkInTo', {
        checkInTo: toStr,
      });
    }

    if (clientId) {
      queryBuilder.andWhere('reservation.clientId = :clientId', { clientId });
    }

    if (roomId) {
      queryBuilder.andWhere('reservation.roomId = :roomId', { roomId });
    }

    // Búsqueda por código de reserva, DNI o nombre del cliente
    if (search) {
      queryBuilder.andWhere(
        '(reservation.code ILIKE :search OR client.dni ILIKE :search OR client.firstName ILIKE :search OR client.lastName ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    queryBuilder
      .orderBy('reservation.checkIn', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    // Debug: en desarrollo imprimimos la consulta SQL y parámetros para
    // verificar que el WHERE use DATE(reservation.checkIn) correctamente.
    if (process.env.NODE_ENV !== 'production') {
      try {
        // getQueryAndParameters devuelve [query, parameters] en TypeORM
        // Si la versión de TypeORM difiere, esto no debe romper en prod.
        // Mostramos por console.debug para no interferir en stdout principal.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const qp: any = (queryBuilder as any).getQueryAndParameters
          ? (queryBuilder as any).getQueryAndParameters()
          : [(queryBuilder as any).getQuery(), (queryBuilder as any).getParameters()];
        console.debug('[DEBUG] Reservation.findAll SQL:', qp[0]);
        console.debug('[DEBUG] Reservation.findAll PARAMS:', qp[1]);
      } catch (e) {
        // no hacer nada en caso de error de introspección
      }
    }

    const [ormEntities, total] = await queryBuilder.getManyAndCount();

    const MS_PER_DAY = 1000 * 60 * 60 * 24;

    const toLocalDate = (value: Date | string): Date => {
      if (value instanceof Date) return value;
      const str = String(value).substring(0, 10);
      const [yearStr, monthStr, dayStr] = str.split('-');
      const year = parseInt(yearStr, 10);
      const month = parseInt(monthStr, 10);
      const day = parseInt(dayStr, 10);
      return new Date(year, month - 1, day);
    };

    const data: ReservationListItemView[] = ormEntities.map((entity) => {
      const checkIn = toLocalDate(entity.checkIn as unknown as Date | string);
      const checkOut = toLocalDate(entity.checkOut as unknown as Date | string);

      const totalNights = Math.max(
        1,
        Math.ceil((checkOut.getTime() - checkIn.getTime()) / MS_PER_DAY),
      );

      const pricePerNightRaw = entity.room?.roomType?.precioPorNoche;
      const pricePerNight =
        typeof pricePerNightRaw === 'number'
          ? pricePerNightRaw
          : pricePerNightRaw !== undefined && pricePerNightRaw !== null
            ? Number(pricePerNightRaw)
            : undefined;
      const totalPrice =
        pricePerNight !== undefined
          ? Math.round(pricePerNight * totalNights * 100) / 100
          : undefined;

      return {
        id: entity.id,
        code: entity.code,
        clientId: entity.clientId,
        roomId: entity.roomId ?? null,
        status: entity.status as ReservationStatus,
        checkIn,
        checkOut,
        createdAt:
          entity.createdAt instanceof Date
            ? entity.createdAt
            : new Date(entity.createdAt),
        updatedAt:
          entity.updatedAt instanceof Date
            ? entity.updatedAt
            : new Date(entity.updatedAt),
        totalNights,
        totalPrice,
        client: entity.client
          ? {
              id: entity.client.id,
              dni: entity.client.dni,
              firstName: entity.client.firstName,
              lastName: entity.client.lastName,
              email: entity.client.email,
              phone: entity.client.phone,
            }
          : null,
        room: entity.room
          ? {
              id: entity.room.id,
              numeroHabitacion: entity.room.numeroHabitacion,
              roomTypeCode: entity.room.roomType?.code,
              roomTypeName: entity.room.roomType?.name,
              estado: entity.room.estado,
              pricePerNight,
            }
          : null,
      };
    });

    return {
      data,
      total,
    };
  }
}
