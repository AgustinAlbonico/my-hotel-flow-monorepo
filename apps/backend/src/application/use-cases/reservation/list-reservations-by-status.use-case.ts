import { Injectable, Inject } from '@nestjs/common';
import type {
  IReservationRepository,
  ReservationListItemView,
} from '../../../domain/repositories/reservation.repository.interface';
import { ListReservationsQueryDto } from '../../dtos/reservation/list-reservations-query.dto';
import { AutoCancelNoShowUseCase } from './auto-cancel-no-show.use-case';

/**
 * ListReservationsByStatusUseCase
 * Listar reservas por estado (ej: CONFIRMED)
 */
@Injectable()
export class ListReservationsByStatusUseCase {
  constructor(
    @Inject('IReservationRepository')
    private readonly reservationRepository: IReservationRepository,
    private readonly autoCancelNoShowUseCase: AutoCancelNoShowUseCase,
  ) { }

  async execute(query: ListReservationsQueryDto): Promise<{
    data: ReservationListItemView[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    // Verificación on-demand de no-shows al consultar reservas
    // Se ejecuta de forma asíncrona sin bloquear la consulta
    this.autoCancelNoShowUseCase.execute().catch(() => {
      // Ignorar errores silenciosamente para no afectar la consulta
    });

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
