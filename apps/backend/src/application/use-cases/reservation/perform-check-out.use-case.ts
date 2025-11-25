import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import type { IReservationRepository } from '../../../domain/repositories/reservation.repository.interface';
import type { IRoomRepository } from '../../../domain/repositories/room.repository.interface';
import type { IInvoiceRepository } from '../../../domain/repositories/invoice.repository.interface';
import type { IClientRepository } from '../../../domain/repositories/client.repository.interface';
import type { IAccountMovementRepository } from '../../../domain/repositories/account-movement.repository.interface';
import { CheckOutDto } from '../../dtos/reservation/check-out.dto';
import {
  CheckOutRecord,
  RoomCondition,
} from '../../../domain/value-objects/check-out-record.value-object';
import { RoomStatus } from '../../../domain/entities/room.entity';
import { ReservationStatus } from '../../../domain/entities/reservation.entity';
import { Invoice } from '../../../domain/entities/invoice.entity';
import { AccountMovement } from '../../../domain/entities/account-movement.entity';

/**
 * PerformCheckOutUseCase
 * Patrón: Use Case - Clean Architecture
 * Capa: Application
 * Responsabilidad: Ejecutar el proceso de check-out y generar factura
 */
@Injectable()
export class PerformCheckOutUseCase {
  constructor(
    @Inject('IReservationRepository')
    private readonly reservationRepository: IReservationRepository,
    @Inject('IRoomRepository')
    private readonly roomRepository: IRoomRepository,
    @Inject('IInvoiceRepository')
    private readonly invoiceRepository: IInvoiceRepository,
    @Inject('IClientRepository')
    private readonly clientRepository: IClientRepository,
    @Inject('IAccountMovementRepository')
    private readonly accountMovementRepository: IAccountMovementRepository,
  ) {}

  async execute(
    reservationId: number,
    userId: number,
    dto: CheckOutDto,
  ): Promise<void> {
    // 1. Buscar reserva
    const reservation =
      await this.reservationRepository.findById(reservationId);
    if (!reservation) {
      throw new NotFoundException(
        `Reserva con ID ${reservationId} no encontrada`,
      );
    }

    // 2. Verificar que la reserva está en estado IN_PROGRESS
    if (reservation.status !== ReservationStatus.IN_PROGRESS) {
      throw new BadRequestException(
        'Solo se puede hacer check-out de reservas en progreso',
      );
    }

    // 3. Crear CheckOutRecord
    const checkOutRecord = CheckOutRecord.create(
      userId,
      dto.roomCondition,
      dto.observations,
    );

    // 4. Completar reserva y agregar checkOutRecord
    reservation.complete(checkOutRecord);

    // 5. Actualizar estado de habitación
    const room = await this.roomRepository.findById(reservation.roomId);
    if (!room) {
      throw new NotFoundException(
        `Habitación con ID ${reservation.roomId} no encontrada`,
      );
    }

    // Si requiere limpieza profunda, marcar como MAINTENANCE, sino AVAILABLE
    const newStatus = checkOutRecord.requiresDeepCleaning()
      ? RoomStatus.MAINTENANCE
      : RoomStatus.AVAILABLE;

    room.changeStatus(newStatus);

    // 6. Generar factura automáticamente
    const existingInvoice =
      await this.invoiceRepository.findByReservationId(reservationId);

    if (!existingInvoice) {
      // Calcular subtotal
      const nights = reservation.calculateNights();
      const pricePerNight = 1000; // TODO: Obtener precio real de room type
      const subtotal = nights * pricePerNight;

      const invoice = Invoice.create(
        reservationId,
        reservation.clientId,
        subtotal,
        21, // IVA 21%
        `Factura por estadía - Reserva ${reservation.code}`,
      );

      await this.invoiceRepository.save(invoice);

      // 7. Actualizar saldo del cliente y registrar en cuenta corriente
      const client = await this.clientRepository.findById(reservation.clientId);
      if (client) {
        // Obtener el último balance de la cuenta corriente
        const lastBalance = await this.accountMovementRepository.getLastBalance(
          client.id,
        );

        // Crear movimiento de cargo por la factura
        const movement = AccountMovement.createCharge(
          client.id,
          invoice.total,
          lastBalance + invoice.total,
          `Factura ${invoice.invoiceNumber} - Reserva ${reservation.code}`,
          invoice.id.toString(),
        );
        await this.accountMovementRepository.save(movement);

        client.addDebt(invoice.total);
        await this.clientRepository.update(client);
      }
    }

    // 8. Persistir cambios (TODO: usar transacción)
    await this.reservationRepository.update(reservation);
    await this.roomRepository.update(room);

    // TODO: Emitir evento CheckOutRealizado
    // TODO: Emitir evento FacturaGenerada
    // TODO: Si requiere limpieza profunda, notificar a housekeeping
    // TODO: Registrar auditoría
  }
}
