/**
 * MercadoPago Webhooks Controller
 * Controlador para recibir notificaciones de MercadoPago
 */
import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  Get,
  Query,
  UseGuards,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { ActionsGuard } from '../guards/actions.guard';
import { Actions } from '../decorators/actions.decorator';
import { ProcessMercadoPagoWebhookUseCase } from '../../application/use-cases/payment/process-mercadopago-webhook.use-case';
import { CreatePaymentPreferenceUseCase } from '../../application/use-cases/payment/create-payment-preference.use-case';
import { PaymentMethod } from '../../domain/entities/payment.entity';
import { MercadoPagoService } from '../../infrastructure/payment/mercadopago.service';

@Controller('webhooks/mercadopago')
export class MercadoPagoWebhooksController {
  private readonly logger = new Logger(MercadoPagoWebhooksController.name);

  constructor(
    private readonly processWebhookUseCase: ProcessMercadoPagoWebhookUseCase,
    private readonly createPreferenceUseCase: CreatePaymentPreferenceUseCase,
    private readonly mercadoPagoService: MercadoPagoService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Webhook de MercadoPago
   * POST /webhooks/mercadopago
   * Este endpoint NO requiere autenticación ya que es llamado por MercadoPago
   */
  @Post()
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Body() body: any,
    @Headers('x-signature') signature: string,
    @Headers('x-request-id') requestId: string,
  ) {
    this.logger.log(`Webhook recibido: ${JSON.stringify(body)}`);
    this.logger.log(`Signature: ${signature}`);
    this.logger.log(`Request ID: ${requestId}`);

    try {
      // 1) Verificar firma si está configurado el secreto
      const webhookSecret = this.configService.get<string>(
        'MERCADOPAGO_WEBHOOK_SECRET',
        '',
      );

      if (webhookSecret) {
        const isValid = this.verifySignature(
          signature,
          requestId,
          body,
          webhookSecret,
        );
        if (!isValid) {
          this.logger.warn('Firma de webhook inválida');
          throw new ForbiddenException('Invalid signature');
        }
      } else {
        this.logger.warn(
          'MERCADOPAGO_WEBHOOK_SECRET no configurado. Saltando verificación de firma.',
        );
      }
      // MercadoPago envía diferentes tipos de notificaciones
      if (body.type === 'payment') {
        // Extraer el ID del pago
        const paymentId = body.data?.id;

        if (!paymentId) {
          this.logger.warn('Webhook sin payment ID');
          return { status: 'ignored' };
        }

        // 2) Reconciliar contra API de MP: obtener detalles reales del pago
        const mpPayment = await this.mercadoPagoService.getPayment(paymentId);

        // Validaciones mínimas del objeto retornado
        if (!mpPayment || !('id' in mpPayment)) {
          throw new BadRequestException('Respuesta de MP inválida');
        }

        const paymentData = {
          id: String(mpPayment.id),
          status: String((mpPayment as any).status ?? 'pending'),
          status_detail: String((mpPayment as any).status_detail ?? ''),
          payment_type_id: String((mpPayment as any).payment_type_id ?? ''),
          payment_method_id: String((mpPayment as any).payment_method_id ?? ''),
          transaction_amount: Number(
            (mpPayment as any).transaction_amount ?? 0,
          ),
          payer: {
            email: String((mpPayment as any)?.payer?.email ?? ''),
          },
          external_reference: String(
            (mpPayment as any).external_reference ?? '',
          ),
          metadata: (mpPayment as any).metadata ?? {},
        };

        await this.processWebhookUseCase.execute(paymentData);

        return { status: 'processed' };
      }

      this.logger.log(`Tipo de webhook no manejado: ${body.type}`);
      return { status: 'ignored' };
    } catch (error) {
      this.logger.error('Error procesando webhook:', error);
      // Retornar 200 para evitar reintentos de MercadoPago
      return { status: 'error', message: 'Internal error' };
    }
  }

  /**
   * Crear preferencia de pago
   * POST /webhooks/mercadopago/create-preference
   * Requiere autenticación y permiso de MercadoPago
   */
  @Post('create-preference')
  @UseGuards(JwtAuthGuard, ActionsGuard)
  @Actions('mercadopago.crear')
  async createPreference(
    @Body()
    body: {
      invoiceId: number;
      method?: PaymentMethod | string;
    },
  ) {
    try {
      // Intentar castear el método si viene como string
      let method: PaymentMethod | undefined = undefined;
      if (body.method) {
        const value = String(body.method).toUpperCase();
        if (value in PaymentMethod) {
          method = (PaymentMethod as any)[value] as PaymentMethod;
        }
      }

      return await this.createPreferenceUseCase.execute({
        invoiceId: body.invoiceId,
        method,
      });
    } catch (error) {
      this.logger.error('Error creando preferencia:', error);
      throw error;
    }
  }

  /**
   * Obtener configuración de MercadoPago
   * GET /webhooks/mercadopago/config
   * Endpoint público para obtener la public key
   */
  @Get('config')
  getConfig() {
    return {
      publicKey: this.mercadoPagoService.getPublicKey(),
      isConfigured: this.mercadoPagoService.isConfigured(),
    };
  }

  /**
   * Verifica la firma del webhook de MercadoPago
   * Header x-signature: "ts=..., v1=..."
   * Base string: `id:${body.data.id};request-id:${x-request-id};ts:${ts}`
   * HMAC SHA256 con MERCADOPAGO_WEBHOOK_SECRET debe igualar v1
   */
  private verifySignature(
    signatureHeader: string | undefined,
    requestId: string | undefined,
    body: any,
    secret: string,
  ): boolean {
    if (!signatureHeader || !requestId || !body?.data?.id) return false;

    try {
      const parts = signatureHeader.split(',').map((p) => p.trim());
      const tsPart = parts.find((p) => p.startsWith('ts='));
      const v1Part = parts.find((p) => p.startsWith('v1='));

      if (!tsPart || !v1Part) return false;
      const ts = tsPart.split('=')[1];
      const v1 = v1Part.split('=')[1];

      const base = `id:${body.data.id};request-id:${requestId};ts:${ts}`;
      const computed = crypto
        .createHmac('sha256', secret)
        .update(base)
        .digest('hex');

      return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(v1));
    } catch (e) {
      this.logger.warn(`Fallo verificando firma: ${(e as Error).message}`);
      return false;
    }
  }
}
