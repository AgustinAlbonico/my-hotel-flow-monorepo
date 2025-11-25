/**
 * MercadoPago Payment Repository Implementation
 */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IMercadoPagoPaymentRepository } from '../../../../domain/repositories/mercadopago-payment.repository.interface';
import { MercadoPagoPayment } from '../../../../domain/entities/mercadopago-payment.entity';
import { MercadoPagoPaymentOrmEntity } from '../entities/mercadopago-payment.orm-entity';
import { MercadoPagoPaymentMapper } from '../mappers/mercadopago-payment.mapper';

@Injectable()
export class TypeOrmMercadoPagoPaymentRepository
  implements IMercadoPagoPaymentRepository
{
  constructor(
    @InjectRepository(MercadoPagoPaymentOrmEntity)
    private readonly repository: Repository<MercadoPagoPaymentOrmEntity>,
    private readonly mapper: MercadoPagoPaymentMapper,
  ) {}

  async save(payment: MercadoPagoPayment): Promise<MercadoPagoPayment> {
    const orm = this.mapper.toOrm(payment);
    const saved = await this.repository.save(orm);
    return this.mapper.toDomain(saved);
  }

  async update(payment: MercadoPagoPayment): Promise<void> {
    const orm = this.mapper.toOrm(payment);
    await this.repository.save(orm);
  }

  async findById(id: number): Promise<MercadoPagoPayment | null> {
    const orm = await this.repository.findOne({ where: { id } });
    return orm ? this.mapper.toDomain(orm) : null;
  }

  async findByPreferenceId(
    preferenceId: string,
  ): Promise<MercadoPagoPayment | null> {
    const orm = await this.repository.findOne({ where: { preferenceId } });
    return orm ? this.mapper.toDomain(orm) : null;
  }

  async findByExternalPaymentId(
    externalPaymentId: string,
  ): Promise<MercadoPagoPayment | null> {
    const orm = await this.repository.findOne({ where: { externalPaymentId } });
    return orm ? this.mapper.toDomain(orm) : null;
  }

  async findByInvoiceId(invoiceId: number): Promise<MercadoPagoPayment[]> {
    const orms = await this.repository.find({
      where: { invoiceId },
      order: { createdAt: 'DESC' },
    });
    return orms.map((orm) => this.mapper.toDomain(orm));
  }

  async findByClientId(clientId: number): Promise<MercadoPagoPayment[]> {
    const orms = await this.repository.find({
      where: { clientId },
      order: { createdAt: 'DESC' },
    });
    return orms.map((orm) => this.mapper.toDomain(orm));
  }
}
