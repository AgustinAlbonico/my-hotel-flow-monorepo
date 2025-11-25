/**
 * User Presentation Module
 * Módulo que agrupa todo lo relacionado a Users en la capa de presentación
 */

import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserUseCasesModule } from '../../application/use-cases/user/user-use-cases.module';
import { TypeOrmPersistenceModule } from '../../infrastructure/persistence/typeorm/typeorm-persistence.module';

@Module({
  imports: [UserUseCasesModule, TypeOrmPersistenceModule],
  controllers: [UserController],
})
export class UserPresentationModule {}
