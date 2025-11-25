import { Module } from '@nestjs/common';
import { RoomTypeUseCasesModule } from '../application/use-cases/room-type/room-type-use-cases.module';
import { RoomTypeController } from './controllers/room-type.controller';

/**
 * RoomType Presentation Module
 * Patrón: Module Pattern (NestJS)
 * Capa: Presentation
 * Responsabilidad: Configurar módulo de presentación para tipos de habitación
 */
@Module({
  imports: [RoomTypeUseCasesModule],
  controllers: [RoomTypeController],
})
export class RoomTypePresentationModule {}
