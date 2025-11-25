import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import type { IClientRepository } from '../../../domain/repositories/client.repository.interface';
import type { IRoomRepository } from '../../../domain/repositories/room.repository.interface';
import type { IReservationRepository } from '../../../domain/repositories/reservation.repository.interface';
import { Reservation } from '../../../domain/entities/reservation.entity';
import { DateRange } from '../../../domain/value-objects/date-range.value-object';
import { CreateReservationDto } from '../../dtos/reservation/create-reservation.dto';
import { ReservationCreatedDto } from '../../dtos/reservation/reservation-created.dto';

// Helper interno: parsear una fecha YYYY-MM-DD como fecha local (sin desfasajes por zona horaria)
const parseLocalDate = (dateStr: string): Date => {
  const [yearStr, monthStr, dayStr] = dateStr.substring(0, 10).split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);
  return new Date(year, month - 1, day);
};

/**
 * CreateReservationUseCase
 * Patrón: Use Case - Clean Architecture
 * Capa: Application
 * Responsabilidad: Orquestar la creación de una reserva con validaciones
 */
@Injectable()
export class CreateReservationUseCase {
  constructor(
    @Inject('IClientRepository')
    private readonly clientRepository: IClientRepository,
    @Inject('IRoomRepository')
    private readonly roomRepository: IRoomRepository,
    @Inject('IReservationRepository')
    private readonly reservationRepository: IReservationRepository,
    @Inject('INotificationService')
    private readonly notificationService?: import('../../../domain/services/notification.service.interface').INotificationService,
  ) {}

  async execute(dto: CreateReservationDto): Promise<ReservationCreatedDto> {
    // 1. Validar que el cliente existe
    const client = await this.clientRepository.findById(dto.clientId);
    if (!client) {
      throw new Error('Cliente no encontrado');
    }

    if (!client.isActive) {
      throw new Error('El cliente está inactivo');
    }

    // 1.1. Validar que el cliente no tenga deudas pendientes
    if (client.hasOutstandingDebt()) {
      throw new Error(
        `No se puede crear la reserva. El cliente tiene un saldo pendiente de $${client.outstandingBalance.toFixed(2)}. Por favor, regularice la situación antes de realizar una nueva reserva.`,
      );
    }

    // 1.2. Validar que el cliente no tenga reservas activas (CONFIRMED / IN_PROGRESS)
    const hasActiveReservation =
      await this.reservationRepository.hasActiveReservationByClient(
        dto.clientId,
      );
    if (hasActiveReservation) {
      throw new BadRequestException(
        'El cliente ya tiene una reserva activa. No se puede crear otra hasta que se complete o cancele la actual.',
      );
    }

    // 2. Validar que la habitación existe
    const room = await this.roomRepository.findById(dto.roomId);
    if (!room) {
      throw new Error('Habitación no encontrada');
    }

    if (!room.isActive) {
      throw new Error('La habitación está inactiva');
    }

    // 3. Crear DateRange para validar fechas (interpretando siempre fechas locales)
    const dateRange = DateRange.fromStrings(dto.checkIn, dto.checkOut);

    // 4. Verificar límite de reservas pendientes por cliente (R-102)
    const pendingReservations =
      await this.reservationRepository.countPendingByClient(dto.clientId);
    if (pendingReservations >= 3) {
      throw new Error(
        'Has alcanzado el límite de 3 reservas pendientes. Por favor, completa o cancela alguna antes de crear una nueva.',
      );
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
      throw new Error(
        'La habitación no está disponible para las fechas seleccionadas. Ya existe una reserva confirmada.',
      );
    }

    // 6. Verificar disponibilidad de la habitación (validación adicional)
    const isAvailable = await this.roomRepository.isRoomAvailable(
      dto.roomId,
      dateRange,
    );

    if (!isAvailable) {
      throw new Error(
        'La habitación no está disponible para las fechas seleccionadas',
      );
    }

    // 7. Idempotencia: si viene idempotencyKey, intentar reutilizar reserva existente
    let reservation =
      dto.idempotencyKey && dto.idempotencyKey.trim().length > 0
        ? await this.reservationRepository.findByIdempotencyKey(
            dto.idempotencyKey.trim(),
          )
        : null;

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
    }

    // 8. Calcular datos adicionales
    const cantidadNoches = dateRange.getNights();
    const precioTotal = room.calculateTotalPrice(cantidadNoches);

    // 9. TODO: Enviar notificaciones si están habilitadas
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
          },
        );
      } catch (err) {
        // Registrar y continuar (no bloquear la creación de reserva por fallo de notificación)
        // ideal: enviar a dead-letter / retry queue
        // tslint:disable-next-line:no-console
        console.warn('Error enviando email de reserva:', err);
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
        // tslint:disable-next-line:no-console
        console.warn('Error enviando SMS de reserva:', err);
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
