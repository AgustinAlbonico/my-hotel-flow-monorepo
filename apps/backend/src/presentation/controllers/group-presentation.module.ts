/**
 * Group Presentation Module
 * Módulo que agrupa todo lo relacionado a Groups en la capa de presentación
 */

import { Module } from '@nestjs/common';
import { GroupController } from './group.controller';
import { GroupUseCasesModule } from '../../application/use-cases/group/group-use-cases.module';
import { TypeOrmPersistenceModule } from '../../infrastructure/persistence/typeorm/typeorm-persistence.module';

@Module({
  imports: [GroupUseCasesModule, TypeOrmPersistenceModule],
  controllers: [GroupController],
})
export class GroupPresentationModule {}
