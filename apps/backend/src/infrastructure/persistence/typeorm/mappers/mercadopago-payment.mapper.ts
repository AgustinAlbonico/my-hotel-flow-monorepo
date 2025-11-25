/**
 * MercadoPago Payment Mapper
 */
import { Injectable } from '@nestjs/common';
import {
  MercadoPagoPayment,
  MercadoPagoPaymentStatus,
  MercadoPagoPaymentType,
} from '../../../../domain/entities/mercadopago-payment.entity';
import { MercadoPagoPaymentOrmEntity } from '../entities/mercadopago-payment.orm-entity';

@Injectable()
export class MercadoPagoPaymentMapper {
  /**
   * Convierte de entidad de dominio a entidad ORM
   */
  toOrm(domain: MercadoPagoPayment): MercadoPagoPaymentOrmEntity {
    const orm = new MercadoPagoPaymentOrmEntity();
    orm.id = domain.id;
    orm.invoiceId = domain.invoiceId;
    orm.clientId = domain.clientId;
    orm.preferenceId = domain.preferenceId;
    orm.externalPaymentId = domain.externalPaymentId;
    orm.status = domain.status;
    orm.paymentType = domain.paymentType;
    orm.amount = domain.amount;
    orm.statusDetail = domain.statusDetail;
    orm.paymentMethodId = domain.paymentMethodId;
    orm.payerEmail = domain.payerEmail;
    orm.metadata = domain.metadata;
    orm.createdAt = domain.createdAt;
    orm.updatedAt = domain.updatedAt;
    return orm;
  }

  /**
   * Convierte de entidad ORM a entidad de dominio
   */
  toDomain(orm: MercadoPagoPaymentOrmEntity): MercadoPagoPayment {
    return new MercadoPagoPayment(
      orm.id,
      orm.invoiceId,
      orm.clientId,
      orm.preferenceId,
      orm.externalPaymentId,
      orm.status as MercadoPagoPaymentStatus,
      orm.paymentType as MercadoPagoPaymentType | null,
      Number(orm.amount),
      orm.statusDetail,
      orm.paymentMethodId,
      orm.payerEmail,
      orm.metadata,
      orm.createdAt,
      orm.updatedAt,
    );
  }
}
