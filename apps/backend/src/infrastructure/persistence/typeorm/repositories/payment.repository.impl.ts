import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { IPaymentRepository } from '../../../../domain/repositories/payment.repository.interface';
import type { Payment } from '../../../../domain/entities/payment.entity';
import { PaymentOrmEntity } from '../entities/payment.orm-entity';
import { PaymentMapper } from '../mappers/payment.mapper';

@Injectable()
export class TypeOrmPaymentRepository implements IPaymentRepository {
  constructor(
    @InjectRepository(PaymentOrmEntity)
    private readonly repository: Repository<PaymentOrmEntity>,
    private readonly mapper: PaymentMapper,
  ) {}

  async findById(id: number): Promise<Payment | null> {
    const ormEntity = await this.repository.findOne({ where: { id } });
    return ormEntity ? this.mapper.toDomain(ormEntity) : null;
  }

  async findByInvoiceId(invoiceId: number): Promise<Payment[]> {
    const ormEntities = await this.repository.find({
      where: { invoiceId },
      order: { paidAt: 'DESC' },
    });
    return ormEntities.map((entity) => this.mapper.toDomain(entity));
  }

  async findByClientId(clientId: number): Promise<Payment[]> {
    const ormEntities = await this.repository.find({
      where: { clientId },
      order: { paidAt: 'DESC' },
    });
    return ormEntities.map((entity) => this.mapper.toDomain(entity));
  }

  async findByReference(reference: string): Promise<Payment | null> {
    const ormEntity = await this.repository.findOne({ where: { reference } });
    return ormEntity ? this.mapper.toDomain(ormEntity) : null;
  }

  async findByMpPreferenceId(mpPreferenceId: string): Promise<Payment | null> {
    const ormEntity = await this.repository.findOne({
      where: { mpPreferenceId },
    });
    return ormEntity ? this.mapper.toDomain(ormEntity) : null;
  }

  async findByMpExternalPaymentId(
    mpExternalPaymentId: string,
  ): Promise<Payment | null> {
    const ormEntity = await this.repository.findOne({
      where: { mpExternalPaymentId },
    });
    return ormEntity ? this.mapper.toDomain(ormEntity) : null;
  }

  async save(payment: Payment): Promise<Payment> {
    const ormEntity = this.mapper.toPersistence(payment);
    const saved = await this.repository.save(ormEntity);
    return this.mapper.toDomain(saved);
  }

  async update(payment: Payment): Promise<Payment> {
    const ormEntity = this.mapper.toPersistence(payment);
    const saved = await this.repository.save(ormEntity);
    return this.mapper.toDomain(saved);
  }

  async delete(id: number): Promise<void> {
    await this.repository.delete(id);
  }
}
