import {
    Injectable,
    Inject,
    Logger,
} from '@nestjs/common';
import type { IReservationRepository } from '../../../domain/repositories/reservation.repository.interface';
import type { IRoomRepository } from '../../../domain/repositories/room.repository.interface';
import type { Reservation } from '../../../domain/entities/reservation.entity';
import { RoomStatus } from '../../../domain/entities/room.entity';

/**
 * AutoCancelNoShowUseCase
 * Patrón: Use Case - Clean Architecture
 * Capa: Application
 * Responsabilidad: Detectar y cancelar automáticamente reservas que son No-Show
 * 
 * Un No-Show es una reserva que:
 * - Está en estado CONFIRMED
 * - Su fecha de checkout ya pasó
 * - Nunca se realizó check-in (checkInData es null)
 */
@Injectable()
export class AutoCancelNoShowUseCase {
    private readonly logger = new Logger(AutoCancelNoShowUseCase.name);

    constructor(
        @Inject('IReservationRepository')
        private readonly reservationRepository: IReservationRepository,
        @Inject('IRoomRepository')
        private readonly roomRepository: IRoomRepository,
    ) { }

    /**
     * Ejecutar cancelación automática de reservas no-show
     * @returns Cantidad de reservas canceladas
     */
    async execute(): Promise<number> {
        const currentDate = new Date();

        // 1. Buscar reservas que son no-show
        const noShowReservations = await this.reservationRepository.findConfirmedNoShows(currentDate);

        if (noShowReservations.length === 0) {
            this.logger.debug('No se encontraron reservas no-show para cancelar');
            return 0;
        }

        this.logger.log(`Encontradas ${noShowReservations.length} reservas no-show para cancelar`);

        let canceledCount = 0;

        // 2. Cancelar cada reserva
        for (const reservation of noShowReservations) {
            try {
                // Cancelar la reserva con motivo predefinido
                reservation.cancel('No Show - Cancelación automática por sistema');

                // Liberar la habitación si estaba ocupada
                const room = await this.roomRepository.findById(reservation.roomId);
                if (room && room.estado === RoomStatus.OCCUPIED) {
                    room.markAsAvailable();
                    await this.roomRepository.update(room);
                }

                // Persistir cambios de la reserva
                await this.reservationRepository.update(reservation);

                canceledCount++;

                this.logger.debug(
                    `Reserva ${reservation.code} cancelada automáticamente por no-show`,
                );
            } catch (error) {
                this.logger.error(
                    `Error al cancelar reserva ${reservation.code}: ${error.message}`,
                    error.stack,
                );
                // Continuar con las demás reservas aunque una falle
            }
        }

        this.logger.log(`Proceso completado: ${canceledCount} reservas canceladas por no-show`);

        // TODO: Emitir evento ReservaCanceladaAutomaticamente
        // TODO: Enviar notificación al cliente (opcional)

        return canceledCount;
    }
}
