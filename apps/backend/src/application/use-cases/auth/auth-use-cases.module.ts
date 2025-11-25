/**
 * Auth Use Cases Module
 *
 * Módulo que agrupa todos los casos de uso de autenticación
 */

import { Module } from '@nestjs/common';
import { LoginUseCase } from './login.use-case';
import { RefreshTokenUseCase } from './refresh-token.use-case';
import { ChangePasswordUseCase } from './change-password.use-case';
import { ForgotPasswordUseCase } from './forgot-password.use-case';
import { ResetPasswordWithTokenUseCase } from './reset-password-with-token.use-case';
import { TypeOrmPersistenceModule } from '../../../infrastructure/persistence/typeorm/typeorm-persistence.module';
import { SecurityModule } from '../../../infrastructure/security/security.module';

@Module({
  imports: [
    TypeOrmPersistenceModule, // Provides IUserRepository
    SecurityModule, // Provides IHashService and ITokenService
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
export class AuthUseCasesModule {}
