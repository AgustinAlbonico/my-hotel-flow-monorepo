import { Module } from '@nestjs/common';
import { TypeOrmPersistenceModule } from '../../../infrastructure/persistence/typeorm/typeorm-persistence.module';
import { CreateRoomUseCase } from './create-room.use-case';
import { UpdateRoomUseCase } from './update-room.use-case';
import { DeleteRoomUseCase } from './delete-room.use-case';
import { ListRoomsUseCase } from './list-rooms.use-case';
import { FindRoomByIdUseCase } from './find-room-by-id.use-case';
import { ChangeRoomStatusUseCase } from './change-room-status.use-case';

/**
 * Room Use Cases Module
 * Patrón: Module Pattern (NestJS)
 * Capa: Application
 * Responsabilidad: Agrupar y exportar todos los casos de uso de habitaciones
 */
@Module({
  imports: [TypeOrmPersistenceModule],
  providers: [
    CreateRoomUseCase,
    UpdateRoomUseCase,
    DeleteRoomUseCase,
    ListRoomsUseCase,
    FindRoomByIdUseCase,
    ChangeRoomStatusUseCase,
  ],
  exports: [
    CreateRoomUseCase,
    UpdateRoomUseCase,
    DeleteRoomUseCase,
    ListRoomsUseCase,
    FindRoomByIdUseCase,
    ChangeRoomStatusUseCase,
  ],
})
export class RoomUseCasesModule {}
