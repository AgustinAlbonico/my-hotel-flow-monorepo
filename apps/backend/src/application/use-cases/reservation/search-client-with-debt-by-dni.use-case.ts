import { Inject, Injectable } from '@nestjs/common';
import type { IClientRepository } from '../../../domain/repositories/client.repository.interface';
import type { IInvoiceRepository } from '../../../domain/repositories/invoice.repository.interface';
import type { IReservationRepository } from '../../../domain/repositories/reservation.repository.interface';
import type { IRoomRepository } from '../../../domain/repositories/room.repository.interface';
import { SearchClientByDNIDto } from '../../dtos/reservation/search-client-by-dni.dto';
import { ClientFoundExtendedDto } from '../../dtos/reservation/client-found-extended.dto';
import { DebtInvoiceDto } from '../../dtos/reservation/debt-invoice.dto';

/**
 * SearchClientWithDebtByDNIUseCase
 * Combina la búsqueda de cliente con el estado de deuda (facturas impagas)
 */
@Injectable()
export class SearchClientWithDebtByDNIUseCase {
  constructor(
    @Inject('IClientRepository')
    private readonly clientRepository: IClientRepository,
    @Inject('IInvoiceRepository')
    private readonly invoiceRepository: IInvoiceRepository,
    @Inject('IReservationRepository')
    private readonly reservationRepository: IReservationRepository,
    @Inject('IRoomRepository')
    private readonly roomRepository: IRoomRepository,
  ) {}

  async execute(
    dto: SearchClientByDNIDto,
  ): Promise<ClientFoundExtendedDto | null> {
    const client = await this.clientRepository.findByDni(dto.dni);
    if (!client) return null;

    const invoices = await this.invoiceRepository.findByClientId(client.id);
    const debtInvoices: DebtInvoiceDto[] = [];
    for (const inv of invoices) {
      const outstandingBalance = inv.getOutstandingBalance();
      if (outstandingBalance <= 0) continue;
      const di = new DebtInvoiceDto();
      di.id = inv.id;
      di.invoiceNumber = inv.invoiceNumber;
      di.total = inv.total;
      di.amountPaid = inv.amountPaid;
      di.outstandingBalance = outstandingBalance;
      di.status = inv.status;
      di.isOverdue = inv.isOverdue();
      di.reservationId = inv.reservationId;
      // Enriquecer con datos de la reserva y habitación
      try {
        const reservation = await this.reservationRepository.findById(
          inv.reservationId,
        );
        if (reservation) {
          di.checkIn = reservation.checkIn;
          di.checkOut = reservation.checkOut;
          const room = await this.roomRepository.findById(reservation.roomId);
          if (room) {
            di.roomNumber = room.numeroHabitacion;
            di.roomType = room.roomType.name;
          }
          // Construir descripción amigable
          const fecha = (d: Date) => d.toISOString().substring(0, 10);
          di.description = `Estadía del ${fecha(reservation.checkIn)} al ${fecha(reservation.checkOut)}${di.roomNumber ? ` en habitación ${di.roomNumber}` : ''}${di.roomType ? ` (${di.roomType})` : ''}`;
        }
      } catch {
        // Silenciar errores de enriquecimiento para no romper flujo principal
      }
      debtInvoices.push(di);
    }

    const extended = new ClientFoundExtendedDto(
      client.id,
      client.dni.value,
      client.firstName,
      client.lastName,
      client.email.value,
      client.phone?.value ?? null,
    );
    extended.outstandingBalance = client.outstandingBalance;
    extended.isDebtor =
      extended.outstandingBalance > 0 || debtInvoices.length > 0;
    if (extended.isDebtor) extended.invoices = debtInvoices;
    return extended;
  }
}
