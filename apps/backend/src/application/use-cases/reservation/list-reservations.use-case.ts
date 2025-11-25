import { Injectable, Inject } from '@nestjs/common';
import type {
  IReservationRepository,
  ReservationListItemView,
} from '../../../domain/repositories/reservation.repository.interface';
import { ListReservationsQueryDto } from '../../dtos/reservation/list-reservations-query.dto';

/**
 * ListReservationsUseCase
 * Patrón: Use Case - Clean Architecture
 * Capa: Application
 * Responsabilidad: Listar reservas con filtros y paginación
 */
@Injectable()
export class ListReservationsUseCase {
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
    const toStartOfDay = (value: string | undefined): Date | undefined => {
      if (!value) return undefined;
      const [year, month, day] = value.split('-').map((v) => parseInt(v, 10));
      if (!year || !month || !day) return new Date(value);
      return new Date(year, month - 1, day, 0, 0, 0, 0);
    };

    const toEndOfDay = (value: string | undefined): Date | undefined => {
      if (!value) return undefined;
      const [year, month, day] = value.split('-').map((v) => parseInt(v, 10));
      if (!year || !month || !day) return new Date(value);
      return new Date(year, month - 1, day, 23, 59, 59, 999);
    };

    const filters = {
      status: query.status,
      checkInFrom: toStartOfDay(query.checkInFrom),
      checkInTo: toEndOfDay(query.checkInTo),
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
