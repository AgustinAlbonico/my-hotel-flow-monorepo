/**
 * Create MercadoPago Payment Preference Use Case
 * Crear una preferencia de pago en MercadoPago para una factura
 */
import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import type { IInvoiceRepository } from '../../../domain/repositories/invoice.repository.interface';
import type { IClientRepository } from '../../../domain/repositories/client.repository.interface';
import { MercadoPagoService } from '../../../infrastructure/payment/mercadopago.service';
import {
  PaymentMethod,
  PaymentStatus,
} from '../../../domain/entities/payment.entity';
import type { IPaymentRepository } from '../../../domain/repositories/payment.repository.interface';
import { Payment } from '../../../domain/entities/payment.entity';

export interface CreatePaymentPreferenceInput {
  invoiceId: number;
  method?: PaymentMethod; // Para validar que sólo se cree preferencia para débito/crédito
}

export interface CreatePaymentPreferenceOutput {
  preferenceId: string;
  initPoint: string;
  sandboxInitPoint: string;
}

@Injectable()
export class CreatePaymentPreferenceUseCase {
  constructor(
    @Inject('IInvoiceRepository')
    private readonly invoiceRepository: IInvoiceRepository,
    @Inject('IClientRepository')
    private readonly clientRepository: IClientRepository,
    @Inject('IPaymentRepository')
    private readonly paymentRepository: IPaymentRepository,
    private readonly mercadoPagoService: MercadoPagoService,
  ) {}

  async execute(
    input: CreatePaymentPreferenceInput,
  ): Promise<CreatePaymentPreferenceOutput> {
    // 0. Validación de método de pago (si viene informado desde el frontend)
    if (
      input.method &&
      ![PaymentMethod.CREDIT_CARD, PaymentMethod.DEBIT_CARD].includes(
        input.method,
      )
    ) {
      throw new BadRequestException(
        'MercadoPago sólo está habilitado para débito/crédito',
      );
    }

    // 1. Verificar que MercadoPago esté configurado
    if (!this.mercadoPagoService.isConfigured()) {
      throw new BadRequestException(
        'MercadoPago no está configurado en el servidor',
      );
    }

    // 2. Buscar la factura
    const invoice = await this.invoiceRepository.findById(input.invoiceId);
    if (!invoice) {
      throw new NotFoundException(
        `Factura con ID ${input.invoiceId} no encontrada`,
      );
    }

    // 3. Verificar que la factura pueda recibir pagos
    if (!invoice.canReceivePayment()) {
      throw new BadRequestException(
        'La factura no puede recibir pagos (ya está pagada o cancelada)',
      );
    }

    // 4. Buscar el cliente
    const client = await this.clientRepository.findById(invoice.clientId);
    if (!client) {
      throw new NotFoundException(
        `Cliente con ID ${invoice.clientId} no encontrado`,
      );
    }

    // 5. Calcular el monto pendiente
    const outstandingBalance = invoice.getOutstandingBalance();

    if (outstandingBalance <= 0) {
      throw new BadRequestException('La factura no tiene saldo pendiente');
    }

    // 6. Verificar si ya existe una preferencia pendiente (en un único registro de pagos)
    const existingPayments = await this.paymentRepository.findByInvoiceId(
      invoice.id,
    );
    const pendingWithPreference = existingPayments.find(
      (p) =>
        p.status === PaymentStatus.PENDING &&
        typeof p.mpPreferenceId === 'string' &&
        !!p.mpPreferenceId,
    );

    if (pendingWithPreference && pendingWithPreference.mpPreferenceId) {
      return {
        preferenceId: pendingWithPreference.mpPreferenceId,
        initPoint: `https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=${pendingWithPreference.mpPreferenceId}`,
        sandboxInitPoint: `https://sandbox.mercadopago.com.ar/checkout/v1/redirect?pref_id=${pendingWithPreference.mpPreferenceId}`,
      };
    }

    // 7. Crear preferencia en MercadoPago
    const preference = await this.mercadoPagoService.createPreference({
      title: `Factura ${invoice.invoiceNumber}`,
      quantity: 1,
      unitPrice: outstandingBalance,
      description: `Pago de factura ${invoice.invoiceNumber}`,
      externalReference: `INV-${invoice.id}`,
      payerEmail: client.email.value,
      metadata: {
        invoiceId: invoice.id,
        clientId: client.id,
        invoiceNumber: invoice.invoiceNumber,
        // Guardar método deseado para trazabilidad
        requestedMethod: input.method ?? 'UNKNOWN',
      },
    });

    // 8. Crear/guardar registro de pago PENDING en la misma tabla (unificado)
    const payment = Payment.create(
      invoice.id,
      client.id,
      outstandingBalance,
      input.method ?? PaymentMethod.CREDIT_CARD,
      `MP-PREF-${preference.id!}`,
      `Pago con MercadoPago - preferencia`,
    );
    payment.setMercadoPagoInfo({
      preferenceId: preference.id!,
      status: 'pending',
      metadata: {
        invoiceId: invoice.id,
        clientId: client.id,
        invoiceNumber: invoice.invoiceNumber,
      },
    });
    await this.paymentRepository.save(payment);

    // 9. Retornar URLs de pago
    return {
      preferenceId: preference.id!,
      initPoint: preference.init_point!,
      sandboxInitPoint: preference.sandbox_init_point!,
    };
  }
}
