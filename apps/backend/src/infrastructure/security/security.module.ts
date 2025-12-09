/**
 * Security Module
 * Módulo que proporciona servicios de seguridad (hashing y tokens)
 */
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Argon2HashService } from './hash.service.impl';
import { JwtTokenService } from './token.service.impl';
import { RevokedTokenEntity } from '../persistence/typeorm/entities/revoked-token.orm-entity';

@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('jwt.secret');
        const expiresIn =
          configService.get<string>('jwt.accessExpiration') || '15m';

        if (!secret) {
          throw new Error('JWT Secret is not configured in SecurityModule');
        }

        return {
          secret,
          signOptions: {
            expiresIn: expiresIn as `${number}${'s' | 'm' | 'h' | 'd'}` | number,
          },
        };
      },
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([RevokedTokenEntity]),
  ],
  providers: [
    {
      provide: 'IHashService',
      useClass: Argon2HashService,
    },
    {
      provide: 'ITokenService',
      useClass: JwtTokenService,
    },
  ],
  exports: ['IHashService', 'ITokenService'],
})
export class SecurityModule {}
