/**
 * Action Presentation Module
 * Módulo que agrupa todo lo relacionado a Actions en la capa de presentación
 */

import { Module } from '@nestjs/common';
import { ActionController } from './action.controller';
import { ActionUseCasesModule } from '../../application/use-cases/action/action-use-cases.module';
import { TypeOrmPersistenceModule } from '../../infrastructure/persistence/typeorm/typeorm-persistence.module';

@Module({
  imports: [ActionUseCasesModule, TypeOrmPersistenceModule],
  controllers: [ActionController],
})
export class ActionPresentationModule {}
