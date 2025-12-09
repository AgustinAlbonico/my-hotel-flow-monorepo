import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { MailService } from '../infrastructure/notifications/mail.service';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
    console.log('Iniciando contexto de aplicación para prueba de email...');

    try {
        const app = await NestFactory.createApplicationContext(AppModule, {
            logger: ['error', 'warn', 'log'],
        });

        const mailService = app.get(MailService);
        const configService = app.get(ConfigService);

        const mailFrom = configService.get<string>('MAIL_USER') || 'albofacultad@gmail.com';
        const mailTo = 'agusalbo2024@gmail.com';

        if (!mailFrom) {
            console.error('❌ Error: No se encontró MAIL_USER en .env');
            await app.close();
            process.exit(1);
        }

        console.log(`📧 Enviando email de prueba`);
        console.log(`   Desde: ${mailFrom}`);
        console.log(`   Para: ${mailTo}`);
        console.log(`   Host: ${configService.get('MAIL_HOST')}`);
        console.log(`   Port: ${configService.get('MAIL_PORT')}`);

        const logoUrl = 'https://i.imgur.com/nvcCGnI.jpeg';

        await mailService.sendProfileCreated(mailTo, {
            customer_name: 'Agustín (Prueba)',
            login_url: 'http://localhost:5173/login',
            username: mailTo,
            logo_url: logoUrl,
            support_email: mailFrom,
            year: new Date().getFullYear().toString(),
        });

        console.log('✅ ¡Email enviado exitosamente!');
        console.log('Revisa la bandeja de entrada de agusalbo2024@gmail.com (y spam).');

        await app.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error fatal durante la prueba de envío:');
        console.error(error);
        process.exit(1);
    }
}

bootstrap();
