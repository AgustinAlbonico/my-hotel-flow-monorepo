/**
 * User Use Cases Module
 * Módulo que proporciona todos los casos de uso de Users
 */

import { Module } from '@nestjs/common';
import { TypeOrmPersistenceModule } from '../../../infrastructure/persistence/typeorm/typeorm-persistence.module';
import { SecurityModule } from '../../../infrastructure/security/security.module';
import { ListUsersUseCase } from './list-users.use-case';
import { GetUserByIdUseCase } from './get-user-by-id.use-case';
import { CreateUserUseCase } from './create-user.use-case';
import { UpdateUserUseCase } from './update-user.use-case';
import { DeleteUserUseCase } from './delete-user.use-case';
import { AssignGroupsToUserUseCase } from './assign-groups-to-user.use-case';
import { AssignActionsToUserUseCase } from './assign-actions-to-user.use-case';
import { GetInheritedActionsUseCase } from './get-inherited-actions.use-case';
import { ResetPasswordUseCase } from './reset-password.use-case';

@Module({
  imports: [TypeOrmPersistenceModule, SecurityModule],
  providers: [
    ListUsersUseCase,
    GetUserByIdUseCase,
    CreateUserUseCase,
    UpdateUserUseCase,
    DeleteUserUseCase,
    AssignGroupsToUserUseCase,
    AssignActionsToUserUseCase,
    GetInheritedActionsUseCase,
    ResetPasswordUseCase,
  ],
  exports: [
    ListUsersUseCase,
    GetUserByIdUseCase,
    CreateUserUseCase,
    UpdateUserUseCase,
    DeleteUserUseCase,
    AssignGroupsToUserUseCase,
    AssignActionsToUserUseCase,
    GetInheritedActionsUseCase,
    ResetPasswordUseCase,
  ],
})
export class UserUseCasesModule {}
