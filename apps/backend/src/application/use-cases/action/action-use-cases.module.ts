/**
 * Action Use Cases Module
 * Módulo que proporciona todos los casos de uso de Actions
 */

import { Module } from '@nestjs/common';
import { ListActionsUseCase } from './list-actions.use-case';
import { GetActionByIdUseCase } from './get-action-by-id.use-case';
import { CreateActionUseCase } from './create-action.use-case';
import { UpdateActionUseCase } from './update-action.use-case';
import { DeleteActionUseCase } from './delete-action.use-case';
import { TypeOrmPersistenceModule } from '../../../infrastructure/persistence/typeorm/typeorm-persistence.module';

@Module({
  imports: [TypeOrmPersistenceModule],
  providers: [
    ListActionsUseCase,
    GetActionByIdUseCase,
    CreateActionUseCase,
    UpdateActionUseCase,
    DeleteActionUseCase,
  ],
  exports: [
    ListActionsUseCase,
    GetActionByIdUseCase,
    CreateActionUseCase,
    UpdateActionUseCase,
    DeleteActionUseCase,
  ],
})
export class ActionUseCasesModule {}
