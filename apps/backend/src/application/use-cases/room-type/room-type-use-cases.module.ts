import { Module } from '@nestjs/common';
import { TypeOrmPersistenceModule } from '../../../infrastructure/persistence/typeorm/typeorm-persistence.module';
import { CreateRoomTypeUseCase } from './create-room-type.use-case';
import { ListRoomTypesUseCase } from './list-room-types.use-case';
import { GetRoomTypeByIdUseCase } from './get-room-type-by-id.use-case';
import { UpdateRoomTypeUseCase } from './update-room-type.use-case';
import { DeleteRoomTypeUseCase } from './delete-room-type.use-case';

/**
 * RoomType Use Cases Module
 * Patrón: Module Pattern (NestJS)
 * Capa: Application
 * Responsabilidad: Agrupar y exportar todos los casos de uso de tipos de habitación
 */
@Module({
  imports: [TypeOrmPersistenceModule],
  providers: [
    CreateRoomTypeUseCase,
    ListRoomTypesUseCase,
    GetRoomTypeByIdUseCase,
    UpdateRoomTypeUseCase,
    DeleteRoomTypeUseCase,
  ],
  exports: [
    CreateRoomTypeUseCase,
    ListRoomTypesUseCase,
    GetRoomTypeByIdUseCase,
    UpdateRoomTypeUseCase,
    DeleteRoomTypeUseCase,
  ],
})
export class RoomTypeUseCasesModule {}
