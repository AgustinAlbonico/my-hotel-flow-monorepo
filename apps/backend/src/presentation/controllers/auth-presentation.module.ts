/**
 * Auth Presentation Module
 *
 * Módulo de presentación que expone los endpoints de autenticación
 */

import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthUseCasesModule } from '../../application/use-cases/auth/auth-use-cases.module';
import { UserUseCasesModule } from '../../application/use-cases/user/user-use-cases.module';
import { TypeOrmPersistenceModule } from '../../infrastructure/persistence/typeorm/typeorm-persistence.module';

@Module({
  imports: [AuthUseCasesModule, UserUseCasesModule, TypeOrmPersistenceModule],
  controllers: [AuthController],
})
export class AuthPresentationModule { }
