import { Module } from '@nestjs/common';
import { TypeOrmPersistenceModule } from '../../../infrastructure/persistence/typeorm/typeorm-persistence.module';
import { CreateCaracteristicaUseCase } from './create-caracteristica.use-case';
import { ListCaracteristicasUseCase } from './list-caracteristicas.use-case';
import { UpdateCaracteristicaUseCase } from './update-caracteristica.use-case';
import { DeleteCaracteristicaUseCase } from './delete-caracteristica.use-case';

/**
 * Caracteristica Use Cases Module
 * Patrón: Module Pattern (NestJS)
 * Capa: Application
 * Responsabilidad: Agrupar y exportar todos los casos de uso de características
 */
@Module({
  imports: [TypeOrmPersistenceModule],
  providers: [
    CreateCaracteristicaUseCase,
    ListCaracteristicasUseCase,
    UpdateCaracteristicaUseCase,
    DeleteCaracteristicaUseCase,
  ],
  exports: [
    CreateCaracteristicaUseCase,
    ListCaracteristicasUseCase,
    UpdateCaracteristicaUseCase,
    DeleteCaracteristicaUseCase,
  ],
})
export class CaracteristicaUseCasesModule {}
