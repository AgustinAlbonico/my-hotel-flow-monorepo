/**
 * Group Use Cases Module
 * Módulo que proporciona todos los casos de uso de Groups
 */

import { Module } from '@nestjs/common';
import { TypeOrmPersistenceModule } from '../../../infrastructure/persistence/typeorm/typeorm-persistence.module';
import { ListGroupsUseCase } from './list-groups.use-case';
import { GetGroupByIdUseCase } from './get-group-by-id.use-case';
import { CreateGroupUseCase } from './create-group.use-case';
import { UpdateGroupUseCase } from './update-group.use-case';
import { DeleteGroupUseCase } from './delete-group.use-case';
import { AssignActionsToGroupUseCase } from './assign-actions-to-group.use-case';
import { AssignChildrenToGroupUseCase } from './assign-children-to-group.use-case';
import { GetEffectiveActionsUseCase } from './get-effective-actions.use-case';

@Module({
  imports: [TypeOrmPersistenceModule],
  providers: [
    ListGroupsUseCase,
    GetGroupByIdUseCase,
    CreateGroupUseCase,
    UpdateGroupUseCase,
    DeleteGroupUseCase,
    AssignActionsToGroupUseCase,
    AssignChildrenToGroupUseCase,
    GetEffectiveActionsUseCase,
  ],
  exports: [
    ListGroupsUseCase,
    GetGroupByIdUseCase,
    CreateGroupUseCase,
    UpdateGroupUseCase,
    DeleteGroupUseCase,
    AssignActionsToGroupUseCase,
    AssignChildrenToGroupUseCase,
    GetEffectiveActionsUseCase,
  ],
})
export class GroupUseCasesModule {}
