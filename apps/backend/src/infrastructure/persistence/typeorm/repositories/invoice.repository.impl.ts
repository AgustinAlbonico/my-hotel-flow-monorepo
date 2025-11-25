import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { IInvoiceRepository } from '../../../../domain/repositories/invoice.repository.interface';
import type { Invoice } from '../../../../domain/entities/invoice.entity';
import { InvoiceOrmEntity } from '../entities/invoice.orm-entity';
import { InvoiceMapper } from '../mappers/invoice.mapper';

@Injectable()
export class TypeOrmInvoiceRepository implements IInvoiceRepository {
  constructor(
    @InjectRepository(InvoiceOrmEntity)
    private readonly repository: Repository<InvoiceOrmEntity>,
    private readonly mapper: InvoiceMapper,
  ) {}

  async findById(id: number): Promise<Invoice | null> {
    const ormEntity = await this.repository.findOne({ where: { id } });
    return ormEntity ? this.mapper.toDomain(ormEntity) : null;
  }

  async findByReservationId(reservationId: number): Promise<Invoice | null> {
    const ormEntity = await this.repository.findOne({
      where: { reservationId },
    });
    return ormEntity ? this.mapper.toDomain(ormEntity) : null;
  }

  async findByInvoiceNumber(invoiceNumber: string): Promise<Invoice | null> {
    const ormEntity = await this.repository.findOne({
      where: { invoiceNumber },
    });
    return ormEntity ? this.mapper.toDomain(ormEntity) : null;
  }

  async findByClientId(clientId: number): Promise<Invoice[]> {
    const ormEntities = await this.repository.find({
      where: { clientId },
      order: { createdAt: 'DESC' },
    });
    return ormEntities.map((entity) => this.mapper.toDomain(entity));
  }

  async findAll(): Promise<Invoice[]> {
    const ormEntities = await this.repository.find({
      order: { createdAt: 'DESC' },
    });
    return ormEntities.map((entity) => this.mapper.toDomain(entity));
  }

  async findOverdue(): Promise<Invoice[]> {
    const now = new Date();
    const ormEntities = await this.repository
      .createQueryBuilder('invoice')
      .where('invoice.status IN (:...statuses)', {
        statuses: ['PENDING', 'PARTIAL'],
      })
      .andWhere('invoice.dueDate < :now', { now })
      .orderBy('invoice.dueDate', 'ASC')
      .getMany();

    return ormEntities.map((entity) => this.mapper.toDomain(entity));
  }

  async save(invoice: Invoice): Promise<Invoice> {
    const ormEntity = this.mapper.toPersistence(invoice);

    // Si es nueva factura, generar número
    if (!ormEntity.invoiceNumber) {
      ormEntity.invoiceNumber = await this.generateInvoiceNumber();
    }

    const saved = await this.repository.save(ormEntity);
    return this.mapper.toDomain(saved);
  }

  async update(invoice: Invoice): Promise<Invoice> {
    const ormEntity = this.mapper.toPersistence(invoice);
    const saved = await this.repository.save(ormEntity);
    return this.mapper.toDomain(saved);
  }

  async delete(id: number): Promise<void> {
    await this.repository.delete(id);
  }

  /**
   * Genera un número de factura único
   * Formato: FAC-YYYYMMDD-XXXX
   */
  async generateInvoiceNumber(): Promise<string> {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const datePrefix = `FAC-${year}${month}${day}`;

    // Buscar el último número del día
    const lastInvoice = await this.repository
      .createQueryBuilder('invoice')
      .where('invoice.invoiceNumber LIKE :prefix', {
        prefix: `${datePrefix}%`,
      })
      .orderBy('invoice.invoiceNumber', 'DESC')
      .getOne();

    let sequence = 1;
    if (lastInvoice) {
      const lastNumber = lastInvoice.invoiceNumber.split('-')[2];
      sequence = parseInt(lastNumber, 10) + 1;
    }

    const sequenceStr = String(sequence).padStart(4, '0');
    return `${datePrefix}-${sequenceStr}`;
  }
}
