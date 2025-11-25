import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { IInvoiceRepository } from '../../../domain/repositories/invoice.repository.interface';
import type { IReservationRepository } from '../../../domain/repositories/reservation.repository.interface';
import { Invoice } from '../../../domain/entities/invoice.entity';

/**
 * Generate Invoice Use Case
 * Genera una factura automáticamente basada en una reserva
 */
@Injectable()
export class GenerateInvoiceUseCase {
  constructor(
    @Inject('IInvoiceRepository')
    private readonly invoiceRepository: IInvoiceRepository,
    @Inject('IReservationRepository')
    private readonly reservationRepository: IReservationRepository,
  ) {}

  async execute(reservationId: number): Promise<Invoice> {
    // 1. Verificar que la reserva existe
    const reservation =
      await this.reservationRepository.findById(reservationId);
    if (!reservation) {
      throw new NotFoundException(
        `Reserva con ID ${reservationId} no encontrada`,
      );
    }

    // 2. Idempotencia: si ya existe una factura para la reserva, devolverla
    const existingInvoice =
      await this.invoiceRepository.findByReservationId(reservationId);
    if (existingInvoice) {
      return existingInvoice;
    }

    // 3. Calcular subtotal basado en la reserva
    // TODO: En producción, obtener precio de habitación desde base de datos
    const nights = reservation.calculateNights();
    const pricePerNight = 1000; // Hardcoded por ahora
    const subtotal = nights * pricePerNight;

    // 4. Crear factura
    const invoice = Invoice.create(
      reservationId,
      reservation.clientId,
      subtotal,
      21, // IVA 21%
      `Factura por reserva ${reservation.code}`,
    );

    // 5. Persistir factura
    const savedInvoice = await this.invoiceRepository.save(invoice);

    return savedInvoice;
  }
}
