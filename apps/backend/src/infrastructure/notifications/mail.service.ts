import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import type {
  INotificationService,
  IEmailVariables,
} from '../../domain/services/notification.service.interface';
import Twilio from 'twilio';

/**
 * MailService sirve como implementación de INotificationService.
 * Además de enviar emails (templates), si se configuran credenciales de Twilio
 * también envía SMS usando la API de Twilio.
 */

/**
 * Implementación de INotificationService usando @nestjs-modules/mailer (nodemailer)
 * - Templates en /templates (handlebars)
 * - Expone métodos para enviar mails de perfil y confirmación de reserva
 */
@Injectable()
export class MailService implements INotificationService {
  private readonly logger = new Logger(MailService.name);
  private readonly twilioClient: ReturnType<typeof Twilio> | null = null;
  private readonly twilioFrom: string | undefined;

  constructor(private readonly mailerService: MailerService) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    this.twilioFrom = process.env.TWILIO_FROM;
    if (accountSid && authToken && this.twilioFrom) {
      try {
        this.twilioClient = Twilio(accountSid, authToken);
        this.logger.log('Twilio client inicializado para envíos SMS');
      } catch (err) {
        this.logger.warn('No fue posible inicializar Twilio client: ' + err);
        this.twilioClient = null;
      }
    }
  }

  async sendProfileCreated(
    to: string,
    variables: IEmailVariables,
  ): Promise<void> {
    this.logger.log(`Enviando email de creación de perfil a ${to}`);

    await this.mailerService.sendMail({
      to,
      subject: `Bienvenido a MyHotelFlow, ${variables.customer_name || ''}`,
      template: 'profile-created',
      context: variables,
    });
  }

  async sendReservationConfirmation(
    to: string,
    variables: IEmailVariables,
  ): Promise<void> {
    this.logger.log(
      `Enviando confirmación de reserva a ${to} (res=${variables.reservation_id})`,
    );

    await this.mailerService.sendMail({
      to,
      subject: `Reserva confirmada — ${variables.hotel_name || ''} (${variables.checkin_date || ''} – ${variables.checkout_date || ''})`,
      template: 'reservation-confirmation',
      context: variables,
    });
  }

  async sendSMS(to: string, message: string): Promise<void> {
    if (this.twilioClient && this.twilioFrom) {
      try {
        await this.twilioClient.messages.create({
          body: message,
          from: this.twilioFrom,
          to,
        });
        this.logger.log(`SMS enviado a ${to}`);
      } catch (err) {
        this.logger.error(`Error enviando SMS a ${to}: ${err}`);
        throw err;
      }
    } else {
      // Fallback: registrar el intento y continuar. No lanzar para no romper flujo de negocio.
      this.logger.warn(
        `SMS not sent (Twilio not configured) to=${to} msg="${message}"`,
      );
    }
  }
}
