import { Module } from '@nestjs/common';
import { RoomController } from './controllers/room.controller';
import { RoomUseCasesModule } from '../application/use-cases/room/room-use-cases.module';
import { TypeOrmPersistenceModule } from '../infrastructure/persistence/typeorm/typeorm-persistence.module';
import { RoomMapper } from './mappers/room.mapper';

/**
 * RoomPresentationModule
 * Patrón: Module Pattern (NestJS)
 * Capa: Presentation
 * Responsabilidad: Configurar la capa de presentación para habitaciones
 */
@Module({
  imports: [RoomUseCasesModule, TypeOrmPersistenceModule],
  controllers: [RoomController],
  providers: [RoomMapper],
})
export class RoomPresentationModule {}
