import { Injectable, Inject } from '@nestjs/common';
import type {
  IReservationRepository,
  ReservationListItemView,
} from '../../../domain/repositories/reservation.repository.interface';
import { ListReservationsQueryDto } from '../../dtos/reservation/list-reservations-query.dto';

/**
 * ListReservationsByDateUseCase
 * Listar reservas por fecha de check-in (ej: para check-in del día)
 */
@Injectable()
export class ListReservationsByDateUseCase {
  constructor(
    @Inject('IReservationRepository')
    private readonly reservationRepository: IReservationRepository,
  ) {}

  async execute(query: ListReservationsQueryDto): Promise<{
    data: ReservationListItemView[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const toStartOfDay = (value: string | undefined, fallback?: Date): Date => {
      if (!value) return fallback ?? new Date();
      const [year, month, day] = value.split('-').map((v) => parseInt(v, 10));
      if (!year || !month || !day) return new Date(value);
      return new Date(year, month - 1, day, 0, 0, 0, 0);
    };

    const toEndOfDay = (value: string | undefined, fallback?: Date): Date => {
      if (!value) return fallback ?? new Date();
      const [year, month, day] = value.split('-').map((v) => parseInt(v, 10));
      if (!year || !month || !day) return new Date(value);
      return new Date(year, month - 1, day, 23, 59, 59, 999);
    };

    const today = new Date();
    const todayStart = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      0,
      0,
      0,
      0,
    );
    const todayEnd = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      23,
      59,
      59,
      999,
    );

    const filters = {
      status: query.status,
      checkInFrom: toStartOfDay(query.checkInFrom, todayStart),
      checkInTo: toEndOfDay(query.checkInTo, todayEnd),
      clientId: query.clientId,
      roomId: query.roomId,
      search: query.search,
      page: query.page || 1,
      limit: query.limit || 20,
    };

    const { data, total } = await this.reservationRepository.findAll(filters);

    return {
      data,
      total,
      page: filters.page,
      limit: filters.limit,
      totalPages: Math.ceil(total / filters.limit),
    };
  }
}
