import { Injectable, Inject } from '@nestjs/common';
import type {
  IReservationRepository,
  ReservationListItemView,
} from '../../../domain/repositories/reservation.repository.interface';
import { ListReservationsQueryDto } from '../../dtos/reservation/list-reservations-query.dto';

/**
 * ListReservationsByStatusUseCase
 * Listar reservas por estado (ej: CONFIRMED)
 */
@Injectable()
export class ListReservationsByStatusUseCase {
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
    const filters = {
      status: query.status,
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
