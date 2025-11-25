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
    JwtModule.register({
      secret:
        process.env.JWT_SECRET ||
        'dev-secret-key-please-change-in-production-min-32-chars-long',
      signOptions: {
        expiresIn: '15m',
      },
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
