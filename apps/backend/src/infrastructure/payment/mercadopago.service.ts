/**
 * MercadoPago Configuration Service
 */
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';

@Injectable()
export class MercadoPagoService {
  private client: MercadoPagoConfig;
  private preferenceClient: Preference;
  private paymentClient: Payment;

  constructor(private readonly configService: ConfigService) {
    const accessToken = this.configService.get<string>(
      'MERCADOPAGO_ACCESS_TOKEN',
      '',
    );

    if (!accessToken) {
      console.warn(
        '⚠️  MERCADOPAGO_ACCESS_TOKEN no configurado. Las funciones de pago estarán deshabilitadas.',
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
    metadata?: Record<string, any>;
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

    try {
      const preference = await this.preferenceClient.create({
        body: {
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
          payer: data.payerEmail
            ? {
                email: data.payerEmail,
              }
            : undefined,
          back_urls: {
            success: `${backUrl}/payment/success`,
            failure: `${backUrl}/payment/failure`,
            pending: `${backUrl}/payment/pending`,
          },
          auto_return: 'approved',
          notification_url: notificationUrl,
          external_reference: data.externalReference,
          metadata: data.metadata,
        },
      });

      return preference;
    } catch (error) {
      console.error('Error creando preferencia de MercadoPago:', error);
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
