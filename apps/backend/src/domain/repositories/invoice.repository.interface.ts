import type { Invoice } from '../entities/invoice.entity';

export interface IInvoiceRepository {
  findById(id: number): Promise<Invoice | null>;
  findByReservationId(reservationId: number): Promise<Invoice | null>;
  findByInvoiceNumber(invoiceNumber: string): Promise<Invoice | null>;
  findByClientId(clientId: number): Promise<Invoice[]>;
  findAll(): Promise<Invoice[]>;
  findOverdue(): Promise<Invoice[]>;
  save(invoice: Invoice): Promise<Invoice>;
  update(invoice: Invoice): Promise<Invoice>;
  delete(id: number): Promise<void>;
  generateInvoiceNumber(): Promise<string>;
}
