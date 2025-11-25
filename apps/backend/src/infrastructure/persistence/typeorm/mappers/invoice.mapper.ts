import { Injectable } from '@nestjs/common';
import {
  Invoice,
  InvoiceStatus,
} from '../../../../domain/entities/invoice.entity';
import { InvoiceOrmEntity } from '../entities/invoice.orm-entity';

@Injectable()
export class InvoiceMapper {
  toDomain(orm: InvoiceOrmEntity): Invoice {
    return Invoice.reconstruct({
      id: orm.id,
      reservationId: orm.reservationId,
      clientId: orm.clientId,
      invoiceNumber: orm.invoiceNumber,
      subtotal: Number(orm.subtotal),
      taxRate: Number(orm.taxRate),
      taxAmount: Number(orm.taxAmount),
      total: Number(orm.total),
      amountPaid: Number(orm.amountPaid),
      status: orm.status as InvoiceStatus,
      issuedAt: orm.issuedAt,
      dueDate: orm.dueDate,
      notes: orm.notes,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  toPersistence(domain: Invoice): InvoiceOrmEntity {
    const orm = new InvoiceOrmEntity();
    orm.id = domain.id;
    orm.reservationId = domain.reservationId;
    orm.clientId = domain.clientId;
    orm.invoiceNumber = domain.invoiceNumber;
    orm.subtotal = domain.subtotal;
    orm.taxRate = domain.taxRate;
    orm.taxAmount = domain.taxAmount;
    orm.total = domain.total;
    orm.amountPaid = domain.amountPaid;
    orm.status = domain.status;
    orm.issuedAt = domain.issuedAt;
    orm.dueDate = domain.dueDate;
    orm.notes = domain.notes;
    orm.createdAt = domain.createdAt;
    orm.updatedAt = domain.updatedAt;
    return orm;
  }
}
