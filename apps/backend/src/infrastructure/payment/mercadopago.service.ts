/**
 * MercadoPago Configuration Service
 */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';

/**
 * Interface para el body de preferencia de MercadoPago
 */
interface MercadoPagoPreferenceBody {
  items: Array<{
    id: string;
    title: string;
    quantity: number;
    unit_price: number;
    description?: string;
    currency_id: string;
  }>;
  back_urls: {
    success: string;
    failure: string;
    pending: string;
  };
  notification_url: string;
  external_reference?: string;
  payer?: {
    email: string;
  };
  metadata?: Record<string, unknown>;
}

@Injectable()
export class MercadoPagoService {
  private readonly logger = new Logger(MercadoPagoService.name);
  private client: MercadoPagoConfig;
  private preferenceClient: Preference;
  private paymentClient: Payment;

  constructor(private readonly configService: ConfigService) {
    const accessToken = this.configService.get<string>(
      'MERCADOPAGO_ACCESS_TOKEN',
      '',
    );

    if (!accessToken) {
      this.logger.warn(
        'MERCADOPAGO_ACCESS_TOKEN no configurado. Las funciones de pago estarán deshabilitadas.',
      );
    }

    this.client = new MercadoPagoConfig({
      accessToken,
    });

    this.preferenceClient = new Preference(this.client);
    this.paymentClient = new Payment(this.client);
  }

  /**
   * Crear una preferencia de pago
   */
  async createPreference(data: {
    title: string;
    quantity: number;
    unitPrice: number;
    description?: string;
    externalReference?: string;
    payerEmail?: string;
    metadata?: Record<string, unknown>;
  }) {
    // Normalizar back URL: evitar valores vacíos que rompan back_urls.success
    const rawBackUrl = this.configService.get<string>(
      'MERCADOPAGO_BACK_URL',
      '',
    );
    let backUrl = (rawBackUrl || '').trim();
    if (!backUrl || !/^https?:\/\//i.test(backUrl)) {
      backUrl = 'http://localhost:5173';
    }
    // Remover slash final para evitar dobles //
    backUrl = backUrl.replace(/\/$/, '');

    const rawNotificationUrl = this.configService.get<string>(
      'MERCADOPAGO_NOTIFICATION_URL',
      '',
    );
    const notificationUrl =
      rawNotificationUrl && /^https?:\/\//i.test(rawNotificationUrl)
        ? rawNotificationUrl
        : 'http://localhost:3000/api/webhooks/mercadopago';

    // Construir las URLs de retorno
    const backUrls = {
      success: `${backUrl}/payment/success`,
      failure: `${backUrl}/payment/failure`,
      pending: `${backUrl}/payment/pending`,
    };

    this.logger.debug(`Configurando preferencia MercadoPago con back_urls: ${JSON.stringify(backUrls)}`);

    try {
      const preferenceBody: MercadoPagoPreferenceBody = {
        items: [
          {
            id: data.externalReference || 'item-1',
            title: data.title,
            quantity: data.quantity,
            unit_price: data.unitPrice,
            description: data.description,
            currency_id: 'ARS',
          },
        ],
        back_urls: backUrls,
        notification_url: notificationUrl,
        external_reference: data.externalReference,
      };

      // Solo agregar payer si se proporciona email
      if (data.payerEmail) {
        preferenceBody.payer = {
          email: data.payerEmail,
        };
      }

      // Solo agregar metadata si existe
      if (data.metadata) {
        preferenceBody.metadata = data.metadata;
      }

      const preference = await this.preferenceClient.create({
        body: preferenceBody,
      });

      return preference;
    } catch (error) {
      this.logger.error('Error creando preferencia de MercadoPago', error instanceof Error ? error.stack : String(error));
      throw error;
    }
  }

  /**
   * Obtener información de un pago
   */
  async getPayment(paymentId: string) {
    if (!paymentId) {
      throw new Error('paymentId requerido');
    }

    const response = await this.paymentClient.get({ id: paymentId });
    // El SDK retorna el pago con propiedades conocidas; devolvemos tal cual
    return response;
  }

  /**
   * Verificar si MercadoPago está configurado
   */
  isConfigured(): boolean {
    const accessToken = this.configService.get<string>(
      'MERCADOPAGO_ACCESS_TOKEN',
      '',
    );
    return !!accessToken;
  }

  /**
   * Obtener la public key para el frontend
   */
  getPublicKey(): string {
    return this.configService.get<string>('MERCADOPAGO_PUBLIC_KEY', '');
  }
}
