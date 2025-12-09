import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import type { IReservationRepository } from '../../../domain/repositories/reservation.repository.interface';
import { UpdateReservationDto } from '../../dtos/reservation/update-reservation.dto';
import { AuditService } from '../../../infrastructure/services/audit.service';
import { AuditActionType } from '../../../infrastructure/persistence/typeorm/entities/reservation-audit-log.orm-entity';
import type { AuditContext } from './create-reservation.use-case';

/**
 * UpdateReservationDatesUseCase
 * Patrón: Use Case - Clean Architecture
 * Capa: Application
 * Responsabilidad: Modificar fechas de una reserva con validaciones
 */
@Injectable()
export class UpdateReservationDatesUseCase {
  constructor(
    @Inject('IReservationRepository')
    private readonly reservationRepository: IReservationRepository,
    private readonly auditService: AuditService,
  ) {}

  async execute(
    reservationId: number,
    dto: UpdateReservationDto,
    expectedVersion?: number,
    auditContext?: AuditContext,
  ): Promise<void> {
    // 1. Buscar reserva
    const reservation =
      await this.reservationRepository.findById(reservationId);
    if (!reservation) {
      throw new NotFoundException(
        `Reserva con ID ${reservationId} no encontrada`,
      );
    }

    // 2. Verificar versión (Optimistic Locking)
    // TODO: Implementar verificación de version cuando el mapper lo soporte
    // if (expectedVersion !== undefined && reservation.version !== expectedVersion) {
    //   throw new OptimisticLockingFailureException(
    //     'La reserva fue modificada por otro usuario. Por favor, recarga los datos.',
    //   );
    // }

    // 3. Validar que se puede modificar
    if (!reservation.canBeModified()) {
      throw new BadRequestException(
        'Solo se pueden modificar reservas en estado CONFIRMED',
      );
    }

    // 4. Validar y aplicar nuevas fechas
    if (!dto.checkIn && !dto.checkOut) {
      throw new BadRequestException(
        'Debe proporcionar al menos una fecha para modificar',
      );
    }

    const newCheckIn = dto.checkIn
      ? new Date(dto.checkIn)
      : reservation.checkIn;
    const newCheckOut = dto.checkOut
      ? new Date(dto.checkOut)
      : reservation.checkOut;

    // Guardar valores originales para auditoría
    const oldCheckIn = reservation.checkIn;
    const oldCheckOut = reservation.checkOut;

    // 5. Verificar disponibilidad para las nuevas fechas
    const overlapping =
      await this.reservationRepository.findOverlappingReservations(
        reservation.roomId,
        newCheckIn,
        newCheckOut,
        reservationId, // Excluir la reserva actual
      );

    if (overlapping.length > 0) {
      throw new ConflictException(
        'La habitación no está disponible para las nuevas fechas seleccionadas',
      );
    }

    // 6. Aplicar cambios (la entidad valida las reglas de negocio)
    reservation.modifyDates(newCheckIn, newCheckOut);

    // 7. Persistir
    await this.reservationRepository.update(reservation);

    // 8. Registrar en auditoría
    if (auditContext) {
      await this.auditService.logReservationChange({
        reservationId: reservation.id,
        actionType: AuditActionType.MODIFY_DATES,
        fieldChanged: 'checkIn/checkOut',
        oldValue: { checkIn: oldCheckIn, checkOut: oldCheckOut },
        newValue: { checkIn: newCheckIn, checkOut: newCheckOut },
        userId: auditContext.userId,
        username: auditContext.username,
        system: auditContext.system,
        ipAddress: auditContext.ipAddress,
        userAgent: auditContext.userAgent,
      });
    }

    // TODO: Emitir evento ReservaModificada
    // TODO: Enviar notificación al cliente
  }
}
