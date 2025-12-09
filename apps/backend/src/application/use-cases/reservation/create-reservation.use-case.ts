import { Injectable, Inject, Logger } from '@nestjs/common';
import type { IClientRepository } from '../../../domain/repositories/client.repository.interface';
import type { IRoomRepository } from '../../../domain/repositories/room.repository.interface';
import type { IReservationRepository } from '../../../domain/repositories/reservation.repository.interface';
import { Reservation } from '../../../domain/entities/reservation.entity';
import { DateRange } from '../../../domain/value-objects/date-range.value-object';
import { CreateReservationDto } from '../../dtos/reservation/create-reservation.dto';
import { ReservationCreatedDto } from '../../dtos/reservation/reservation-created.dto';
import { AuditService } from '../../../infrastructure/services/audit.service';
import { AuditActionType } from '../../../infrastructure/persistence/typeorm/entities/reservation-audit-log.orm-entity';
import { parseLocalDate } from '../../../infrastructure/utils/date.utils';
import {
  ClientNotFoundForReservationException,
  ClientInactiveException,
  ClientHasOutstandingDebtException,
  ClientHasActiveReservationException,
  RoomNotFoundForReservationException,
  RoomInactiveException,
  MaxPendingReservationsException,
  RoomNotAvailableException,
} from '../../../domain/exceptions/reservation.exceptions';

export interface AuditContext {
  userId?: number;
  username: string;
  system: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * CreateReservationUseCase
 * Patrón: Use Case - Clean Architecture
 * Capa: Application
 * Responsabilidad: Orquestar la creación de una reserva con validaciones
 */
@Injectable()
export class CreateReservationUseCase {
  private readonly logger = new Logger(CreateReservationUseCase.name);

  constructor(
    @Inject('IClientRepository')
    private readonly clientRepository: IClientRepository,
    @Inject('IRoomRepository')
    private readonly roomRepository: IRoomRepository,
    @Inject('IReservationRepository')
    private readonly reservationRepository: IReservationRepository,
    private readonly auditService: AuditService,
    @Inject('INotificationService')
    private readonly notificationService?: import('../../../domain/services/notification.service.interface').INotificationService,
  ) { }

  async execute(
    dto: CreateReservationDto,
    auditContext?: AuditContext,
  ): Promise<ReservationCreatedDto> {
    // 1. Validar que el cliente existe
    const client = await this.clientRepository.findById(dto.clientId);
    if (!client) {
      throw new ClientNotFoundForReservationException(dto.clientId);
    }

    if (!client.isActive) {
      throw new ClientInactiveException(dto.clientId);
    }

    // 1.1. Validar que el cliente no tenga deudas pendientes
    if (client.hasOutstandingDebt()) {
      throw new ClientHasOutstandingDebtException(dto.clientId, client.outstandingBalance);
    }

    // 1.2. Validar que el cliente no tenga reservas activas (CONFIRMED / IN_PROGRESS)
    const hasActiveReservation =
      await this.reservationRepository.hasActiveReservationByClient(
        dto.clientId,
      );
    if (hasActiveReservation) {
      throw new ClientHasActiveReservationException(dto.clientId);
    }

    // 2. Validar que la habitación existe
    const room = await this.roomRepository.findById(dto.roomId);
    if (!room) {
      throw new RoomNotFoundForReservationException(dto.roomId);
    }

    if (!room.isActive) {
      throw new RoomInactiveException(dto.roomId);
    }

    // 3. Crear DateRange para validar fechas (interpretando siempre fechas locales)
    const dateRange = DateRange.fromStrings(dto.checkIn, dto.checkOut);

    // 4. Verificar límite de reservas pendientes por cliente (R-102)
    const MAX_PENDING_RESERVATIONS = 3;
    const pendingReservations =
      await this.reservationRepository.countPendingByClient(dto.clientId);
    if (pendingReservations >= MAX_PENDING_RESERVATIONS) {
      throw new MaxPendingReservationsException(dto.clientId, MAX_PENDING_RESERVATIONS);
    }

    // 5. Verificar superposición de reservas (prevención de overbooking)
    const checkInDate = parseLocalDate(dto.checkIn);
    const checkOutDate = parseLocalDate(dto.checkOut);

    const overlappingReservations =
      await this.reservationRepository.findOverlappingReservations(
        dto.roomId,
        checkInDate,
        checkOutDate,
      );

    if (overlappingReservations.length > 0) {
      throw new RoomNotAvailableException(dto.roomId, dto.checkIn, dto.checkOut);
    }

    // 6. Verificar disponibilidad de la habitación (validación adicional)
    const isAvailable = await this.roomRepository.isRoomAvailable(
      dto.roomId,
      dateRange,
    );

    if (!isAvailable) {
      throw new RoomNotAvailableException(dto.roomId, dto.checkIn, dto.checkOut);
    }

    // 7. Idempotencia: si viene idempotencyKey, intentar reutilizar reserva existente
    let reservation =
      dto.idempotencyKey && dto.idempotencyKey.trim().length > 0
        ? await this.reservationRepository.findByIdempotencyKey(
          dto.idempotencyKey.trim(),
        )
        : null;

    // 8. Calcular datos adicionales antes de crear la reserva
    const cantidadNoches = dateRange.getNights();
    const precioTotal = room.calculateTotalPrice(cantidadNoches);

    if (!reservation) {
      // Crear la reserva usando el factory method de la entidad
      reservation = Reservation.create(
        dto.clientId,
        dto.roomId,
        checkInDate,
        checkOutDate,
        dto.idempotencyKey?.trim() || null,
      );

      // Persistir la reserva
      reservation = await this.reservationRepository.save(reservation);

      // Registrar en auditoría
      if (auditContext) {
        await this.auditService.logReservationChange({
          reservationId: reservation.id,
          actionType: AuditActionType.CREATE,
          userId: auditContext.userId,
          username: auditContext.username,
          system: auditContext.system,
          ipAddress: auditContext.ipAddress,
          userAgent: auditContext.userAgent,
          metadata: {
            clientId: dto.clientId,
            roomId: dto.roomId,
            checkIn: dto.checkIn,
            checkOut: dto.checkOut,
            nights: cantidadNoches,
            totalPrice: precioTotal,
          },
        });
      }
    }

    // 9. Enviar notificaciones si están habilitadas
    if (!reservation || !dto.notifyByEmail || !this.notificationService) {
      // En el caso idempotente, no reenviamos notificaciones
      // ni si no se solicitó notifyByEmail
    } else if (dto.notifyByEmail && this.notificationService) {
      try {
        await this.notificationService.sendReservationConfirmation(
          client.email.toString(),
          {
            customer_name: `${client.firstName} ${client.lastName}`,
            reservation_id: reservation.id,
            reservation_code: reservation.code,
            hotel_name: room.roomType?.name || 'Hotel',
            room_type: room.roomType?.name || 'Habitación',
            checkin_date: dto.checkIn,
            checkout_date: dto.checkOut,
            nights: cantidadNoches,
            guests: room.capacidad ?? 1,
            total_price: precioTotal,
            currency: '$',
            booking_link: `${process.env.APP_URL || 'https://app.myhotelflow.example'}/bookings/${reservation.id}`,
            support_email:
              process.env.SUPPORT_EMAIL || 'soporte@myhotelflow.example',
            year: new Date().getFullYear(),
            logo_url: 'https://i.imgur.com/nvcCGnI.jpeg',
          },
        );
      } catch (err) {
        // Registrar y continuar (no bloquear la creación de reserva por fallo de notificación)
        this.logger.warn('Error enviando email de reserva', err instanceof Error ? err.stack : String(err));
      }
    }

    if (!reservation || !dto.notifyBySMS || !this.notificationService) {
      // No enviar SMS en llamadas idempotentes o si no se solicitó
    } else if (dto.notifyBySMS && this.notificationService) {
      try {
        const smsMessage = `Reserva confirmada: ${room.roomType?.name || 'Hotel'} ${dto.checkIn}-${dto.checkOut}. Total: $ ${precioTotal}. Ref: ${reservation.id}`;
        await this.notificationService.sendSMS(
          client.phone?.toString() ?? '',
          smsMessage,
        );
      } catch (err) {
        this.logger.warn('Error enviando SMS de reserva', err instanceof Error ? err.stack : String(err));
      }
    }

    // 10. Retornar DTO con la reserva creada (nueva o existente)
    return new ReservationCreatedDto(
      reservation.id,
      reservation.code,
      reservation.clientId,
      reservation.roomId,
      reservation.checkIn,
      reservation.checkOut,
      reservation.status,
      cantidadNoches,
      precioTotal,
      reservation.createdAt,
    );
  }
}
