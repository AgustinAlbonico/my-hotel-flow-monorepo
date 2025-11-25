import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './strategies/jwt.strategy';

/**
 * Authentication Strategies Module
 *
 * Módulo que configura las estrategias de autenticación de Passport
 * (JWT, Local, etc.)
 */
@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('jwt.secret');
        const expiresIn =
          configService.get<string>('jwt.accessExpiration') || '15m';

        if (!secret) {
          throw new Error('JWT Secret is not configured');
        }

        return {
          secret,
          signOptions: {
            expiresIn: expiresIn as any,
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [JwtStrategy],
  exports: [PassportModule, JwtModule],
})
export class AuthStrategiesModule {}
