/**
 * Reservation Use Cases Module
 * Patrón: Module Pattern - NestJS
 * Capa: Application
 * Responsabilidad: Agrupar y exportar use cases de reservas
 */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GetReservationManagementMenuUseCase } from './get-reservation-management-menu.use-case';
import { SearchClientByDNIUseCase } from './search-client-by-dni.use-case';
import { SearchClientWithDebtByDNIUseCase } from './search-client-with-debt-by-dni.use-case';
import { SearchAvailableRoomsUseCase } from './search-available-rooms.use-case';
import { CreateReservationUseCase } from './create-reservation.use-case';
import { CancelReservationUseCase } from './cancel-reservation.use-case';
import { UpdateReservationDatesUseCase } from './update-reservation-dates.use-case';
import { PerformCheckInUseCase } from './perform-check-in.use-case';
import { PerformCheckOutUseCase } from './perform-check-out.use-case';
import { ListReservationsUseCase } from './list-reservations.use-case';
import { ListReservationsByStatusUseCase } from './list-reservations-by-status.use-case';
import { ListReservationsByDateUseCase } from './list-reservations-by-date.use-case';
import { GetDailyOccupancyUseCase } from './get-daily-occupancy.use-case';
import { PresentationCommonModule } from '../../../presentation/presentation-common.module';
import { ClientOrmEntity } from '../../../infrastructure/persistence/typeorm/entities/client.orm-entity';
import { RoomOrmEntity } from '../../../infrastructure/persistence/typeorm/entities/room.orm-entity';
import { ReservationOrmEntity } from '../../../infrastructure/persistence/typeorm/entities/reservation.orm-entity';
import { TypeOrmClientRepository } from '../../../infrastructure/persistence/typeorm/repositories/client.repository.impl';
import { TypeOrmRoomRepository } from '../../../infrastructure/persistence/typeorm/repositories/room.repository.impl';
import { TypeOrmReservationRepository } from '../../../infrastructure/persistence/typeorm/repositories/reservation.repository.impl';
import { ClientMapper } from '../../../infrastructure/persistence/typeorm/mappers/client.mapper';
import { RoomMapper } from '../../../infrastructure/persistence/typeorm/mappers/room.mapper';
import { ReservationMapper } from '../../../infrastructure/persistence/typeorm/mappers/reservation.mapper';
import { InvoiceOrmEntity } from '../../../infrastructure/persistence/typeorm/entities/invoice.orm-entity';
import { TypeOrmInvoiceRepository } from '../../../infrastructure/persistence/typeorm/repositories/invoice.repository.impl';
import { InvoiceMapper } from '../../../infrastructure/persistence/typeorm/mappers/invoice.mapper';
import { AccountMovementOrmEntity } from '../../../infrastructure/persistence/typeorm/entities/account-movement.orm-entity';
import { TypeOrmAccountMovementRepository } from '../../../infrastructure/persistence/typeorm/repositories/account-movement.repository.impl';
import { AccountMovementMapper } from '../../../infrastructure/persistence/typeorm/mappers/account-movement.mapper';

@Module({
  imports: [
    PresentationCommonModule,
    TypeOrmModule.forFeature([
      ClientOrmEntity,
      RoomOrmEntity,
      ReservationOrmEntity,
      InvoiceOrmEntity,
      AccountMovementOrmEntity,
    ]),
  ],
  providers: [
    ClientMapper,
    RoomMapper,
    ReservationMapper,
    InvoiceMapper,
    AccountMovementMapper,
    {
      provide: 'IClientRepository',
      useClass: TypeOrmClientRepository,
    },
    {
      provide: 'IRoomRepository',
      useClass: TypeOrmRoomRepository,
    },
    {
      provide: 'IReservationRepository',
      useClass: TypeOrmReservationRepository,
    },
    {
      provide: 'IInvoiceRepository',
      useClass: TypeOrmInvoiceRepository,
    },
    {
      provide: 'IAccountMovementRepository',
      useClass: TypeOrmAccountMovementRepository,
    },
    GetReservationManagementMenuUseCase,
    SearchClientByDNIUseCase,
    SearchClientWithDebtByDNIUseCase,
    SearchAvailableRoomsUseCase,
    CreateReservationUseCase,
    CancelReservationUseCase,
    UpdateReservationDatesUseCase,
    PerformCheckInUseCase,
    PerformCheckOutUseCase,
    ListReservationsUseCase,
    ListReservationsByStatusUseCase,
    ListReservationsByDateUseCase,
    GetDailyOccupancyUseCase,
  ],
  exports: [
    GetReservationManagementMenuUseCase,
    SearchClientByDNIUseCase,
    SearchClientWithDebtByDNIUseCase,
    SearchAvailableRoomsUseCase,
    CreateReservationUseCase,
    CancelReservationUseCase,
    UpdateReservationDatesUseCase,
    PerformCheckInUseCase,
    PerformCheckOutUseCase,
    ListReservationsUseCase,
    ListReservationsByStatusUseCase,
    ListReservationsByDateUseCase,
    GetDailyOccupancyUseCase,
  ],
})
export class ReservationUseCasesModule {}
