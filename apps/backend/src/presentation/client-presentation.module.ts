import { Module } from '@nestjs/common';
import { ClientController } from './controllers/client.controller';
import { ClientUseCasesModule } from '../application/use-cases/client/client-use-cases.module';
import { TypeOrmPersistenceModule } from '../infrastructure/persistence/typeorm/typeorm-persistence.module';

/**
 * ClientPresentationModule
 * Capa: Presentation
 * Módulo de presentación para endpoints de clientes
 */
@Module({
  imports: [ClientUseCasesModule, TypeOrmPersistenceModule],
  controllers: [ClientController],
})
export class ClientPresentationModule {}
