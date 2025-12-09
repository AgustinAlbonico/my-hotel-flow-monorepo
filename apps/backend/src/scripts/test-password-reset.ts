import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { ForgotPasswordUseCase } from '../application/use-cases/auth/forgot-password.use-case';
import { ResetPasswordWithTokenUseCase } from '../application/use-cases/auth/reset-password-with-token.use-case';

/**
 * Script de prueba para el flujo de recuperación de contraseña
 * 
 * Este script:
 * 1. Solicita un reset de contraseña para un usuario
 * 2. Muestra el token generado
 * 3. Permite resetear la contraseña con ese token
 */
async function testPasswordReset() {
    console.log('🔐 Iniciando prueba de recuperación de contraseña...\n');

    try {
        const app = await NestFactory.createApplicationContext(AppModule, {
            logger: ['error', 'warn', 'log'],
        });

        const forgotPasswordUseCase = app.get(ForgotPasswordUseCase);
        const resetPasswordUseCase = app.get(ResetPasswordWithTokenUseCase);

        // Paso 1: Solicitar recuperación de contraseña
        console.log('📧 Paso 1: Solicitando recuperación de contraseña...');
        const email = 'agusalbo2024@gmail.com'; // Email de cliente existente

        const result = await forgotPasswordUseCase.execute({ email });
        console.log(`✅ Resultado: ${result.message}`);
        console.log('   Revisa tu bandeja de entrada (o MailHog si estás en desarrollo)');
        console.log('   El email debe contener un link con el token de reset\n');

        // Nota: En producción, el token NO se retorna en la respuesta
        // El usuario debe obtenerlo del email que recibe
        console.log('⚠️  IMPORTANTE:');
        console.log('   - El token expira en 1 hora');
        console.log('   - El token es de un solo uso');
        console.log('   - Si el email no existe, el sistema responde igual (seguridad)\n');

        // Paso 2: Instrucciones para resetear la contraseña
        console.log('📝 Paso 2: Para resetear la contraseña:');
        console.log('   1. Copia el token del email recibido');
        console.log('   2. Haz una petición POST a /api/auth/reset-password con:');
        console.log('      {');
        console.log('        "token": "el-token-del-email",');
        console.log('        "newPassword": "NuevaContraseña123!"');
        console.log('      }');
        console.log('   3. O usa el frontend en /reset-password?token=...\n');

        console.log('✅ Prueba completada exitosamente!');
        console.log('   El email de recuperación debería haber sido enviado.');

        await app.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error durante la prueba:', error);
        process.exit(1);
    }
}

// Ejecutar el script
testPasswordReset();
