/**
 * Process MercadoPago Webhook Use Case
 * Procesar notificación de webhook de MercadoPago
 */
import { Injectable, Inject, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import type { IPaymentRepository } from '../../../domain/repositories/payment.repository.interface';
import type { IInvoiceRepository } from '../../../domain/repositories/invoice.repository.interface';
import type { IClientRepository } from '../../../domain/repositories/client.repository.interface';
import type { IAccountMovementRepository } from '../../../domain/repositories/account-movement.repository.interface';
import { PaymentStatus } from '../../../domain/entities/payment.entity';
import { AccountMovement } from '../../../domain/entities/account-movement.entity';

export interface MercadoPagoWebhookData {
  id: string; // ID del pago en MercadoPago
  type: string; // payment, subscription, etc.
  action: string; // payment.created, payment.updated
  data: {
    id: string; // External payment ID
  };
}

export interface PaymentData {
  id: string;
  status: string;
  status_detail: string;
  payment_type_id: string;
  payment_method_id: string;
  transaction_amount: number;
  payer: {
    email: string;
  };
  external_reference: string;
  metadata: Record<string, any>;
}

@Injectable()
export class ProcessMercadoPagoWebhookUseCase {
  private readonly logger = new Logger(ProcessMercadoPagoWebhookUseCase.name);

  constructor(
    @Inject('IPaymentRepository')
    private readonly paymentRepository: IPaymentRepository,
    @Inject('IInvoiceRepository')
    private readonly invoiceRepository: IInvoiceRepository,
    @Inject('IClientRepository')
    private readonly clientRepository: IClientRepository,
    @Inject('IAccountMovementRepository')
    private readonly accountMovementRepository: IAccountMovementRepository,
    private readonly dataSource: DataSource,
  ) {}

  async execute(paymentData: PaymentData): Promise<void> {
    this.logger.log(
      `Procesando webhook de MercadoPago: ${paymentData.id} - Status: ${paymentData.status}`,
    );

    // Usar transacción para garantizar consistencia
    await this.dataSource.transaction(async () => {
      // 1. Extraer external reference (INV-123)
      const externalRef = paymentData.external_reference;
      if (!externalRef || !externalRef.startsWith('INV-')) {
        this.logger.warn(
          `External reference inválido: ${externalRef}. Ignorando webhook.`,
        );
        return;
      }

      const invoiceId = parseInt(externalRef.replace('INV-', ''), 10);

      // 2. Localizar el Payment unificado a partir del id externo o la preferencia
      let unifiedPayment =
        await this.paymentRepository.findByMpExternalPaymentId(paymentData.id);

      if (!unifiedPayment) {
        // Fallback: buscar por invoice y el primer pago pendiente con preferencia
        const candidatePayments =
          await this.paymentRepository.findByInvoiceId(invoiceId);
        unifiedPayment =
          candidatePayments.find(
            (p) =>
              p.status === PaymentStatus.PENDING &&
              typeof p.mpPreferenceId === 'string' &&
              !!p.mpPreferenceId,
          ) || null;
      }

      if (!unifiedPayment) {
        this.logger.warn(
          `No se encontró Payment unificado para invoice ${invoiceId}`,
        );
        return;
      }

      // 3. Actualizar campos de MP en el Payment unificado
      unifiedPayment.setMercadoPagoInfo({
        externalPaymentId: paymentData.id,
        status: paymentData.status,
        statusDetail: paymentData.status_detail,
        paymentType: paymentData.payment_type_id,
        paymentMethodId: paymentData.payment_method_id,
        payerEmail: paymentData.payer?.email ?? null,
        metadata: paymentData.metadata ?? {},
      });

      // 4. Transicionar estado según status de MP
      if (paymentData.status === 'approved') {
        if (unifiedPayment.status !== PaymentStatus.COMPLETED) {
          unifiedPayment.setReference(`MP-${paymentData.id}`);
          unifiedPayment.markAsCompleted();
        }
      } else if (
        paymentData.status === 'rejected' ||
        paymentData.status === 'cancelled'
      ) {
        if (unifiedPayment.status === PaymentStatus.PENDING) {
          unifiedPayment.markAsFailed();
        }
      }

      // Persistir cambios del Payment unificado
      const savedPayment = await this.paymentRepository.update(unifiedPayment);

      // 5. Si el pago quedó COMPLETED, aplicar contabilidad (factura, cliente, movimiento)
      if (savedPayment.status === PaymentStatus.COMPLETED) {
        const invoice = await this.invoiceRepository.findById(invoiceId);
        if (!invoice) {
          this.logger.error(`Factura ${invoiceId} no encontrada`);
          return;
        }

        // Evitar doble aplicación si la factura ya está ajustada por este pago
        // Asumimos que invoice.recordPayment es idempotente respecto al monto total abonado
        invoice.recordPayment(savedPayment.amount);
        await this.invoiceRepository.update(invoice);

        const client = await this.clientRepository.findById(invoice.clientId);
        if (!client) {
          this.logger.error(`Cliente ${invoice.clientId} no encontrado`);
          return;
        }

        const lastBalance = await this.accountMovementRepository.getLastBalance(
          client.id,
        );

        const movement = AccountMovement.createPayment(
          client.id,
          savedPayment.amount,
          lastBalance - savedPayment.amount,
          `Pago con MercadoPago - ${paymentData.payment_method_id}`,
          savedPayment.id.toString(),
        );
        await this.accountMovementRepository.save(movement);

        client.reduceDebt(savedPayment.amount);
        await this.clientRepository.update(client);

        this.logger.log(
          `✅ Pago procesado exitosamente: ${savedPayment.id} - $${savedPayment.amount}`,
        );
      } else if (savedPayment.status === PaymentStatus.FAILED) {
        this.logger.warn(
          `❌ Pago rechazado: ${paymentData.id} - ${paymentData.status_detail}`,
        );
      } else if (savedPayment.status === PaymentStatus.PENDING) {
        this.logger.log(`⏳ Pago pendiente: ${paymentData.id}`);
      }
    });
  }

  // Nota: Si fuera necesario mapear payment_type_id a PaymentMethod, usar un helper sencillo.
}
