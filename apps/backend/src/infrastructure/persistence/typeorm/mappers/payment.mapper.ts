import { Injectable } from '@nestjs/common';
import {
  Payment,
  PaymentMethod,
  PaymentStatus,
} from '../../../../domain/entities/payment.entity';
import { PaymentOrmEntity } from '../entities/payment.orm-entity';

@Injectable()
export class PaymentMapper {
  toDomain(orm: PaymentOrmEntity): Payment {
    return Payment.reconstruct({
      id: orm.id,
      invoiceId: orm.invoiceId,
      clientId: orm.clientId,
      amount: Number(orm.amount),
      method: orm.method as PaymentMethod,
      status: orm.status as PaymentStatus,
      reference: orm.reference,
      notes: orm.notes,
      paidAt: orm.paidAt,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
      mpPreferenceId: orm.mpPreferenceId,
      mpExternalPaymentId: orm.mpExternalPaymentId,
      mpStatus: orm.mpStatus,
      mpStatusDetail: orm.mpStatusDetail,
      mpPaymentType: orm.mpPaymentType,
      mpPaymentMethodId: orm.mpPaymentMethodId,
      mpPayerEmail: orm.mpPayerEmail,
      mpMetadata: orm.mpMetadata,
    });
  }

  toPersistence(domain: Payment): PaymentOrmEntity {
    const orm = new PaymentOrmEntity();
    orm.id = domain.id;
    orm.invoiceId = domain.invoiceId;
    orm.clientId = domain.clientId;
    orm.amount = domain.amount;
    orm.method = domain.method;
    orm.status = domain.status;
    orm.reference = domain.reference;
    orm.notes = domain.notes;
    orm.paidAt = domain.paidAt;
    orm.createdAt = domain.createdAt;
    orm.updatedAt = domain.updatedAt;
    orm.mpPreferenceId = domain.mpPreferenceId ?? null;
    orm.mpExternalPaymentId = domain.mpExternalPaymentId ?? null;
    orm.mpStatus = domain.mpStatus ?? null;
    orm.mpStatusDetail = domain.mpStatusDetail ?? null;
    orm.mpPaymentType = domain.mpPaymentType ?? null;
    orm.mpPaymentMethodId = domain.mpPaymentMethodId ?? null;
    orm.mpPayerEmail = domain.mpPayerEmail ?? null;
    orm.mpMetadata = (domain.mpMetadata as Record<string, any>) ?? {};
    return orm;
  }
}
