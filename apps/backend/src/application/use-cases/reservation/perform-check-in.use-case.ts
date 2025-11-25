import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import type { IReservationRepository } from '../../../domain/repositories/reservation.repository.interface';
import type { IRoomRepository } from '../../../domain/repositories/room.repository.interface';
import { CheckInDto } from '../../dtos/reservation/check-in.dto';
import { CheckInRecord } from '../../../domain/value-objects/check-in-record.value-object';
import { RoomStatus } from '../../../domain/entities/room.entity';
import { ReservationStatus } from '../../../domain/entities/reservation.entity';

/**
 * PerformCheckInUseCase
 * Patrón: Use Case - Clean Architecture
 * Capa: Application
 * Responsabilidad: Ejecutar el proceso de check-in
 */
@Injectable()
export class PerformCheckInUseCase {
  constructor(
    @Inject('IReservationRepository')
    private readonly reservationRepository: IReservationRepository,
    @Inject('IRoomRepository')
    private readonly roomRepository: IRoomRepository,
  ) {}

  async execute(
    reservationId: number,
    userId: number,
    dto: CheckInDto,
  ): Promise<void> {
    // 1. Buscar reserva
    const reservation =
      await this.reservationRepository.findById(reservationId);
    if (!reservation) {
      throw new NotFoundException(
        `Reserva con ID ${reservationId} no encontrada`,
      );
    }

    // 2. Idempotencia: si ya está en progreso no repetir lógica ni lanzar error
    if (reservation.status === ReservationStatus.IN_PROGRESS) {
      return; // Ya se hizo el check-in previamente
    }

    // 3. Verificar que la reserva está en estado CONFIRMED para permitir check-in
    if (reservation.status !== ReservationStatus.CONFIRMED) {
      throw new BadRequestException(
        'Solo se puede hacer check-in de reservas confirmadas',
      );
    }

    // 4. Validar ventana temporal del check-in
    // Regla de negocio: solo permitir check-in a partir del día de inicio
    // Documentación: R-302 / FLUJO_OPERATIVO_HOTEL.md
    const now = new Date();

    // Normalizar ambas fechas a "solo fecha" en zona local para comparar días
    const reservationCheckInDate = new Date(
      reservation.checkIn.getFullYear(),
      reservation.checkIn.getMonth(),
      reservation.checkIn.getDate(),
      0,
      0,
      0,
      0,
    );
    const todayDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0,
      0,
    );

    if (todayDate < reservationCheckInDate) {
      throw new BadRequestException(
        'El check-in solo puede realizarse a partir del día de inicio de la reserva.',
      );
    }

    // 5. Crear CheckInRecord
    const checkInRecord = CheckInRecord.create(
      userId,
      dto.documentsVerified,
      dto.observations,
    );

    // 6. Cambiar estado de reserva a IN_PROGRESS y agregar checkInRecord
    reservation.startCheckIn(checkInRecord);

    // 7. Actualizar estado de habitación a OCCUPIED
    const room = await this.roomRepository.findById(reservation.roomId);
    if (!room) {
      throw new NotFoundException(
        `Habitación con ID ${reservation.roomId} no encontrada`,
      );
    }

    room.changeStatus(RoomStatus.OCCUPIED);

    // 8. Persistir cambios (TODO: usar transacción)
    await this.reservationRepository.update(reservation);
    await this.roomRepository.update(room);

    // TODO: Emitir evento CheckInRealizado
    // TODO: Registrar auditoría
  }
}
