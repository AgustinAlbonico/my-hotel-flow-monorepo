/**
 * Auth Use Cases Module
 *
 * Módulo que agrupa todos los casos de uso de autenticación
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoginUseCase } from './login.use-case';
import { RefreshTokenUseCase } from './refresh-token.use-case';
import { ChangePasswordUseCase } from './change-password.use-case';
import { ForgotPasswordUseCase } from './forgot-password.use-case';
import { ResetPasswordWithTokenUseCase } from './reset-password-with-token.use-case';
import { TypeOrmPersistenceModule } from '../../../infrastructure/persistence/typeorm/typeorm-persistence.module';
import { SecurityModule } from '../../../infrastructure/security/security.module';
import { AuditModule } from '../../../infrastructure/audit.module';

@Module({
  imports: [
    ConfigModule, // Provides ConfigService
    TypeOrmPersistenceModule, // Provides IUserRepository
    SecurityModule, // Provides IHashService and ITokenService
    AuditModule, // Provides AuditService
  ],
  providers: [
    LoginUseCase,
    RefreshTokenUseCase,
    ChangePasswordUseCase,
    ForgotPasswordUseCase,
    ResetPasswordWithTokenUseCase,
  ],
  exports: [
    LoginUseCase,
    RefreshTokenUseCase,
    ChangePasswordUseCase,
    ForgotPasswordUseCase,
    ResetPasswordWithTokenUseCase,
  ],
})
export class AuthUseCasesModule { }
