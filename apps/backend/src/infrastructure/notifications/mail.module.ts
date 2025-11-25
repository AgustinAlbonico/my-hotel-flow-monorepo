import { Module } from '@nestjs/common';
import { MailerModule, MailerOptions } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { join } from 'path';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailService } from './mail.service';

/**
 * Módulo que configura el Mailer y provee la implementación de INotificationService
 */
@Module({
  imports: [
    ConfigModule,
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (config: ConfigService): Promise<MailerOptions> => ({
        transport: {
          host:
            config.get<string>('MAIL_HOST') ||
            process.env.MAIL_HOST ||
            'localhost',
          port: parseInt(
            config.get<string>('MAIL_PORT') || process.env.MAIL_PORT || '1025',
            10,
          ),
          secure:
            (config.get<string>('MAIL_SECURE') || process.env.MAIL_SECURE) ===
              'true' || false,
          auth:
            process.env.MAIL_USER || config.get<string>('MAIL_USER')
              ? {
                  user:
                    config.get<string>('MAIL_USER') || process.env.MAIL_USER,
                  pass:
                    config.get<string>('MAIL_PASS') || process.env.MAIL_PASS,
                }
              : undefined,
        },
        defaults: {
          from:
            config.get<string>('MAIL_FROM') ||
            'MyHotelFlow <no-reply@myhotelflow.example>',
        },
        template: {
          dir: join(__dirname, 'templates'),
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
