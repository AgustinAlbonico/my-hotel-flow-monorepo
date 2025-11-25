import { Module } from '@nestjs/common';
import { CaracteristicaUseCasesModule } from '../application/use-cases/caracteristica/caracteristica-use-cases.module';
import { CaracteristicaController } from './controllers/caracteristica.controller';
import { CaracteristicaMapper } from './mappers/caracteristica.mapper';

/**
 * Caracteristica Presentation Module
 * Patrón: Module Pattern (NestJS)
 * Capa: Presentation
 * Responsabilidad: Configurar módulo de presentación para características
 */
@Module({
  imports: [CaracteristicaUseCasesModule],
  controllers: [CaracteristicaController],
  providers: [CaracteristicaMapper],
})
export class CaracteristicaPresentationModule {}
