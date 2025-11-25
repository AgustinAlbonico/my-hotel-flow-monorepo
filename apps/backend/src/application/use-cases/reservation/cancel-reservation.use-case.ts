import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import type { IReservationRepository } from '../../../domain/repositories/reservation.repository.interface';
import type { IRoomRepository } from '../../../domain/repositories/room.repository.interface';
import { RoomStatus } from '../../../domain/entities/room.entity';
import { CancelReservationDto } from '../../dtos/reservation/cancel-reservation.dto';

/**
 * CancelReservationUseCase
 * Patrón: Use Case - Clean Architecture
 * Capa: Application
 * Responsabilidad: Orquestar la cancelación de una reserva con validaciones de negocio
 */
@Injectable()
export class CancelReservationUseCase {
  constructor(
    @Inject('IReservationRepository')
    private readonly reservationRepository: IReservationRepository,
    @Inject('IRoomRepository')
    private readonly roomRepository: IRoomRepository,
  ) {}

  async execute(
    reservationId: number,
    dto: CancelReservationDto,
  ): Promise<void> {
    // 1. Buscar reserva
    const reservation =
      await this.reservationRepository.findById(reservationId);
    if (!reservation) {
      throw new NotFoundException(
        `Reserva con ID ${reservationId} no encontrada`,
      );
    }

    // 2. Validar que se puede cancelar (política de 24h y estado)
    if (!reservation.canBeCancelled()) {
      throw new BadRequestException(
        'La reserva no puede ser cancelada. Verifica el estado y la política de cancelación (24 horas antes del check-in)',
      );
    }

    // 3. Cancelar la reserva (delegamos validaciones a la entidad de dominio)
    reservation.cancel(dto.reason);

    // 4. Si la reserva estaba activa, asegurar que la habitación quede disponible
    const room = await this.roomRepository.findById(reservation.roomId);
    if (room && room.estado === RoomStatus.OCCUPIED) {
      room.markAsAvailable();
      await this.roomRepository.update(room);
    }

    // 5. Persistir cambios de la reserva
    await this.reservationRepository.update(reservation);

    // TODO: Emitir evento ReservaCancelada
    // TODO: Enviar notificación al cliente
  }
}
