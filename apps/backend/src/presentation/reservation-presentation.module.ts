/**
 * Reservation Presentation Module
 * Patrón: Module Pattern - NestJS
 * Capa: Presentation
 * Responsabilidad: Agrupar controllers y providers de reservas
 */
import { Module } from '@nestjs/common';
import { ReservationManagementController } from './controllers/reservation-management.controller';
import { ReservationController } from './controllers/reservation.controller';
import { OccupancyController } from './controllers/occupancy.controller';
import { ReservationMapper } from './mappers/reservation.mapper';
import { ReservationUseCasesModule } from '../application/use-cases/reservation/reservation-use-cases.module';

@Module({
  imports: [ReservationUseCasesModule],
  controllers: [
    ReservationManagementController,
    ReservationController,
    OccupancyController,
  ],
  providers: [
    ReservationMapper,
    // Casos de uso para endpoints nuevos
    // Se proveen aquí para inyección en el controlador
    // (también están en el módulo de use cases)
    // Si ya están exportados desde ReservationUseCasesModule, pueden omitirse aquí
  ],
})
export class ReservationPresentationModule {}
