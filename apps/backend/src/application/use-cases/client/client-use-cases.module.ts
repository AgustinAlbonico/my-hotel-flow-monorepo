import { Module } from '@nestjs/common';
import { TypeOrmPersistenceModule } from '../../../infrastructure/persistence/typeorm/typeorm-persistence.module';
import { SecurityModule } from '../../../infrastructure/security/security.module';
import { CreateClientUseCase } from './create-client.use-case';
import { ListClientsUseCase } from './list-clients.use-case';
import { GetClientByIdUseCase } from './get-client-by-id.use-case';
import { UpdateClientUseCase } from './update-client.use-case';
import { DeleteClientUseCase } from './delete-client.use-case';

/**
 * ClientUseCasesModule
 * Capa: Application
 * Exporta los casos de uso de clientes
 */
@Module({
  imports: [TypeOrmPersistenceModule, SecurityModule],
  providers: [
    CreateClientUseCase,
    ListClientsUseCase,
    GetClientByIdUseCase,
    UpdateClientUseCase,
    DeleteClientUseCase,
  ],
  exports: [
    CreateClientUseCase,
    ListClientsUseCase,
    GetClientByIdUseCase,
    UpdateClientUseCase,
    DeleteClientUseCase,
  ],
})
export class ClientUseCasesModule {}
